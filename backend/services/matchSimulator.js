import Match from '../models/Match.js';
import { settleBetsForMatch } from './betSettlement.js';
// Pre-defined teams for simulation
const SPORTS_TEAMS = {
  Football: [
    'Manchester United', 'Chelsea', 'Real Madrid', 'Barcelona', 
    'Liverpool', 'Bayern Munich', 'Arsenal', 'Manchester City',
    'Juventus', 'Paris Saint-Germain'
  ],
  Basketball: [
    'LA Lakers', 'Golden State Warriors', 'Boston Celtics', 
    'Miami Heat', 'Chicago Bulls', 'Brooklyn Nets', 
    'Milwaukee Bucks', 'Phoenix Suns'
  ],
  'CS:GO': [
    'Natus Vincere', 'FaZe Clan', 'Team Vitality', 'G2 Esports', 
    'Astralis', 'Heroic', 'Team Liquid', 'MOUZ'
  ],
  'League of Legends': [
    'T1', 'Gen.G', 'Fnatic', 'Cloud9', 'JD Gaming', 
    'G2 Esports', 'Weibo Gaming', 'Team Liquid'
  ]
};
// Generate random number between min and max
const randomRange = (min, max) => Math.random() * (max - min) + min;
// Select random element from array
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
// Generate a random new match
const generateRandomMatch = () => {
  const sports = Object.keys(SPORTS_TEAMS);
  const sport = randomChoice(sports);
  const teams = SPORTS_TEAMS[sport];
  
  // Pick two distinct teams
  const homeTeam = randomChoice(teams);
  let awayTeam = randomChoice(teams);
  while (awayTeam === homeTeam) {
    awayTeam = randomChoice(teams);
  }
  // Set match configurations based on sport
  let maxTime = 90; // Football
  let odds = { home: 2.10, draw: 3.20, away: 2.30 };
  if (sport === 'Basketball') {
    maxTime = 48;
    odds = { home: 1.90, draw: 0, away: 1.90 }; // No draw in basketball
  } else if (sport === 'CS:GO') {
    maxTime = 30; // Max 30 rounds in regular time
    odds = { home: 1.85, draw: 0, away: 1.95 }; // No draw in standard match betting
  } else if (sport === 'League of Legends') {
    maxTime = 40; // Approx 40 minutes target game length
    odds = { home: 1.70, draw: 0, away: 2.10 }; // No draw in LOL
  }
  // Randomize initial odds slightly
  const skew = randomRange(-0.3, 0.3);
  odds.home = Math.round((odds.home + skew) * 100) / 100;
  if (odds.draw > 0) {
    odds.draw = Math.round((odds.draw - skew / 2) * 100) / 100;
  }
  odds.away = Math.round((odds.away - skew) * 100) / 100;
  // Small delay of 1 minute (simulation: 30 secs/ticks) before match goes live
  const status = Math.random() > 0.4 ? 'live' : 'upcoming';
  return {
    sport,
    homeTeam,
    awayTeam,
    status,
    score: { home: 0, away: 0 },
    odds,
    gameTime: status === 'live' ? Math.floor(randomRange(1, maxTime / 2)) : 0,
    maxTime,
    timeline: status === 'live' ? [{ time: 1, event: 'Match Started' }] : [],
    startedAt: status === 'live' ? new Date() : null,
  };
};
// Recalculate odds based on current score and time remaining
const calculateLiveOdds = (sport, score, gameTime, maxTime) => {
  const timeRemainingRatio = 1 - gameTime / maxTime;
  const scoreDiff = score.home - score.away; // positive if home leads, negative if away leads
  let homeProb, awayProb, drawProb = 0;
  if (sport === 'Football') {
    // Football: draws are common
    // Base weight
    let wHome = 0.38 * Math.exp(scoreDiff * 0.9 / (timeRemainingRatio + 0.1));
    let wAway = 0.34 * Math.exp(-scoreDiff * 0.9 / (timeRemainingRatio + 0.1));
    let wDraw = 0.28 * (timeRemainingRatio + 0.1); // Draw becomes less likely as score difference increases
    // If score difference is 0, draw is more likely when time is running out
    if (scoreDiff === 0) {
      wDraw = 0.45 / (timeRemainingRatio + 0.2);
    }
    const totalWeight = wHome + wAway + wDraw;
    homeProb = wHome / totalWeight;
    awayProb = wAway / totalWeight;
    drawProb = wDraw / totalWeight;
  } else {
    // Basketball, Esports (no draw)
    let wHome = 0.5 * Math.exp(scoreDiff * 0.3 / (timeRemainingRatio + 0.05));
    let wAway = 0.5 * Math.exp(-scoreDiff * 0.3 / (timeRemainingRatio + 0.05));
    const totalWeight = wHome + wAway;
    homeProb = wHome / totalWeight;
    awayProb = wAway / totalWeight;
  }
  // Inject 6% bookmaker margin (payout rate 94%)
  const marginMultiplier = 0.94;
  let homeOdds = Math.round((marginMultiplier / homeProb) * 100) / 100;
  let awayOdds = Math.round((marginMultiplier / awayProb) * 100) / 100;
  let drawOdds = drawProb > 0 ? Math.round((marginMultiplier / drawProb) * 100) / 100 : 0;
  // Caps and rules
  // If game is in final stages (e.g. > 90% done), lock/suspend the odds if score difference is significant
  const finalStage = timeRemainingRatio < 0.1;
  const matchLocked = finalStage && Math.abs(scoreDiff) >= (sport === 'Football' ? 2 : sport === 'Basketball' ? 12 : 3);
  if (matchLocked) {
    return { home: 1.01, draw: drawOdds > 0 ? 99.00 : 0, away: 99.00 }; // Lock down
  }
  // Clamp odds
  const clampOdds = (val) => {
    if (val <= 0) return 0;
    if (val < 1.02) return 1.02;
    if (val > 80) return 80.00;
    return val;
  };
  return {
    home: clampOdds(homeOdds),
    draw: drawOdds > 0 ? clampOdds(drawOdds) : 0,
    away: clampOdds(awayOdds),
  };
};
// Update matches logic
export const progressMatches = async (io) => {
  try {
    // 1. Fetch all non-finished matches
    const activeMatches = await Match.find({ status: { $ne: 'finished' } });
    // Ensure we have at least 4 active matches (live + upcoming)
    if (activeMatches.length < 4) {
      const newMatchData = generateRandomMatch();
      const newMatch = new Match(newMatchData);
      await newMatch.save();
      console.log(`Generated new ${newMatch.sport} match: ${newMatch.homeTeam} vs ${newMatch.awayTeam}`);
      
      // Notify client that a new match is available
      io.emit('new_match', newMatch);
      activeMatches.push(newMatch);
    }
    // 2. Loop through active matches and update them
    for (const match of activeMatches) {
      if (match.status === 'upcoming') {
        // Randomly transition upcoming matches to live
        if (Math.random() > 0.7) {
          match.status = 'live';
          match.startedAt = new Date();
          match.timeline.push({ time: 0, event: 'Match Started' });
          await match.save();
          io.emit('match_status_change', { matchId: match._id, status: 'live', timeline: match.timeline });
          console.log(`Match ${match.homeTeam} vs ${match.awayTeam} is now LIVE!`);
        }
        continue;
      }
      // Match is live, progress it
      let timeIncrement = 1;
      let scoreChance = 0.05; // Base goal chance
      if (match.sport === 'Football') {
        timeIncrement = Math.floor(randomRange(3, 7)); // Jump 3-7 minutes per tick
        scoreChance = 0.12; // 12% chance of goal per tick
      } else if (match.sport === 'Basketball') {
        timeIncrement = Math.floor(randomRange(2, 4));
        scoreChance = 0.95; // Almost guaranteed basket(s)
      } else if (match.sport === 'CS:GO') {
        timeIncrement = 1; // 1 round per tick
        scoreChance = 1.0; // 100% chance round is won
      } else if (match.sport === 'League of Legends') {
        timeIncrement = Math.floor(randomRange(1, 3));
        scoreChance = 0.40; // Kill or objective event
      }
      // Update game time
      match.gameTime += timeIncrement;
      if (match.gameTime >= match.maxTime) {
        match.gameTime = match.maxTime;
      }
      let scoreEvent = null;
      // Determine score change
      if (Math.random() < scoreChance && match.gameTime < match.maxTime) {
        const scorer = Math.random() > 0.5 ? 'home' : 'away';
        const scoringTeamName = scorer === 'home' ? match.homeTeam : match.awayTeam;
        if (match.sport === 'Football') {
          match.score[scorer] += 1;
          scoreEvent = `GOAL! ${scoringTeamName} scores! (${match.score.home}-${match.score.away})`;
        } else if (match.sport === 'Basketball') {
          // Add 2 or 3 points
          const points = Math.random() > 0.3 ? 2 : 3;
          match.score[scorer] += points;
          scoreEvent = `${points}-Pointer scored by ${scoringTeamName}!`;
        } else if (match.sport === 'CS:GO') {
          match.score[scorer] += 1;
          scoreEvent = `Round won by ${scorer === 'home' ? 'Counter-Terrorists' : 'Terrorists'} (${scoringTeamName})`;
        } else if (match.sport === 'League of Legends') {
          match.score[scorer] += 1; // Simulated kills/objectives count
          scoreEvent = `${scoringTeamName} secures a kill / objective!`;
        }
        if (scoreEvent) {
          match.timeline.push({ time: match.gameTime, event: scoreEvent });
        }
      }
      // If match reaches maximum time, finish it
      if (match.gameTime >= match.maxTime) {
        // Special CS:GO tiebreaker resolution
        if (match.sport === 'CS:GO' && match.score.home === 15 && match.score.away === 15) {
          // Pick a winner random round 31
          const finalRoundWinner = Math.random() > 0.5 ? 'home' : 'away';
          match.score[finalRoundWinner] += 1;
          match.timeline.push({
            time: 30,
            event: `Final Round won by ${finalRoundWinner === 'home' ? match.homeTeam : match.awayTeam}!`,
          });
        }
        match.status = 'finished';
        match.endedAt = new Date();
        match.timeline.push({ time: match.maxTime, event: 'Match Finished' });
        await match.save();
        io.emit('match_finished', match);
        console.log(`Match ${match.homeTeam} vs ${match.awayTeam} finished! Final score: ${match.score.home}-${match.score.away}`);
        
        // Settle all bets
        await settleBetsForMatch(match, io);
      } else {
        // Match continues, update odds
        match.odds = calculateLiveOdds(match.sport, match.score, match.gameTime, match.maxTime);
        await match.save();
        // Broadcast updates
        io.emit('match_update', {
          matchId: match._id,
          score: match.score,
          odds: match.odds,
          gameTime: match.gameTime,
          timeline: match.timeline,
        });
      }
    }
  } catch (error) {
    console.error('Error in match simulator progression:', error);
  }
};
// Start the simulator loop
export const startSimulator = (io) => {
  const intervalSpeed = process.env.SIMULATION_SPEED_MS || 3000;
  console.log(`Starting real-time Match Simulator (tick speed: ${intervalSpeed}ms)...`);
  
  setInterval(() => {
    progressMatches(io);
  }, intervalSpeed);
};
