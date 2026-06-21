import React, { useState } from 'react';
import { Play, Calendar, Zap, RefreshCw, Trophy, MessageSquare } from 'lucide-react';

const MatchList = ({ matches, activeBetslip, onSelectOdds }) => {
  const [selectedSport, setSelectedSport] = useState('All');

  // Sport category options
  const sportsList = ['All', 'Football', 'Basketball', 'CS:GO', 'League of Legends'];

  // Filter matches
  const filteredMatches = matches.filter((match) => {
    if (selectedSport === 'All') return true;
    return match.sport === selectedSport;
  });

  const liveMatches = filteredMatches.filter((m) => m.status === 'live');
  const upcomingMatches = filteredMatches.filter((m) => m.status === 'upcoming');

  const getSportIcon = (sport) => {
    switch (sport) {
      case 'Football':
        return '⚽';
      case 'Basketball':
        return '🏀';
      case 'CS:GO':
        return '🔫';
      case 'League of Legends':
        return '🔮';
      default:
        return '🏆';
    }
  };

  const isOddsSelected = (matchId, selection) => {
    return (
      activeBetslip &&
      activeBetslip.matchId === matchId &&
      activeBetslip.selection === selection
    );
  };

  const renderMatchCard = (match) => {
    const lastEvent = match.timeline && match.timeline.length > 0
      ? match.timeline[match.timeline.length - 1]
      : null;

    return (
      <div key={match._id} className={`match-card ${match.status}`}>
        {/* Card Header */}
        <div className="card-header">
          <span className="sport-badge">
            <span className="sport-icon">{getSportIcon(match.sport)}</span>
            <span className="sport-name">{match.sport}</span>
          </span>

          {match.status === 'live' ? (
            <span className="live-tag">
              <span className="live-pulse"></span>
              LIVE - {match.gameTime}'
            </span>
          ) : (
            <span className="upcoming-tag">
              <Calendar size={13} />
              Upcoming
            </span>
          )}
        </div>

        {/* Scoreboard / Competitors */}
        <div className="card-body">
          <div className="team-row">
            <span className="team-name">{match.homeTeam}</span>
            {match.status === 'live' && (
              <span className={`score-digit ${match.flashScore ? 'flash' : ''}`}>
                {match.score.home}
              </span>
            )}
          </div>
          <div className="vs-divider">VS</div>
          <div className="team-row">
            <span className="team-name">{match.awayTeam}</span>
            {match.status === 'live' && (
              <span className={`score-digit ${match.flashScore ? 'flash' : ''}`}>
                {match.score.away}
              </span>
            )}
          </div>
        </div>

        {/* Live Timeline Event Log */}
        {match.status === 'live' && lastEvent && (
          <div className="match-ticker">
            <MessageSquare size={12} className="ticker-icon" />
            <span className="ticker-text">
              {lastEvent.time}': {lastEvent.event}
            </span>
          </div>
        )}

        {/* Odds Betting Board */}
        <div className="odds-section">
          {/* Home Win Button */}
          <button
            className={`odds-btn ${isOddsSelected(match._id, 'home') ? 'selected' : ''} ${
              match.flashHomeOdds ? `flash-${match.flashHomeOdds}` : ''
            }`}
            onClick={() => onSelectOdds(match, 'home', match.odds.home)}
          >
            <span className="odds-label">1 (Home)</span>
            <span className="odds-value">{match.odds.home.toFixed(2)}</span>
          </button>

          {/* Draw Button (only if applicable e.g. Football) */}
          {match.odds.draw > 0 && (
            <button
              className={`odds-btn ${isOddsSelected(match._id, 'draw') ? 'selected' : ''}`}
              onClick={() => onSelectOdds(match, 'draw', match.odds.draw)}
            >
              <span className="odds-label">X (Draw)</span>
              <span className="odds-value">{match.odds.draw.toFixed(2)}</span>
            </button>
          )}

          {/* Away Win Button */}
          <button
            className={`odds-btn ${isOddsSelected(match._id, 'away') ? 'selected' : ''} ${
              match.flashAwayOdds ? `flash-${match.flashAwayOdds}` : ''
            }`}
            onClick={() => onSelectOdds(match, 'away', match.odds.away)}
          >
            <span className="odds-label">2 (Away)</span>
            <span className="odds-value">{match.odds.away.toFixed(2)}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="match-list-container">
      {/* Category Pills */}
      <div className="category-tabs">
        {sportsList.map((sport) => (
          <button
            key={sport}
            className={`category-tab ${selectedSport === sport ? 'active' : ''}`}
            onClick={() => setSelectedSport(sport)}
          >
            {sport === 'All' ? <Zap size={15} /> : getSportIcon(sport)}
            <span>{sport}</span>
          </button>
        ))}
      </div>

      {/* Live Matches Section */}
      <div className="matches-group">
        <h2 className="section-title text-live">
          <span className="bullet-live"></span>
          Live Match Action
        </h2>
        {liveMatches.length === 0 ? (
          <div className="empty-matches">
            <RefreshCw className="animate-spin" size={24} />
            <p>No matches live at this moment. Simulation auto-generates matches every few seconds...</p>
          </div>
        ) : (
          <div className="matches-grid">{liveMatches.map(renderMatchCard)}</div>
        )}
      </div>

      {/* Upcoming Matches Section */}
      {upcomingMatches.length > 0 && (
        <div className="matches-group">
          <h2 className="section-title">
            <span className="bullet-upcoming"></span>
            Upcoming Matches
          </h2>
          <div className="matches-grid">{upcomingMatches.map(renderMatchCard)}</div>
        </div>
      )}
    </div>
  );
};

export default MatchList;
