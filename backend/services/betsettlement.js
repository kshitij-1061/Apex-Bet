import Bet from '../models/Bet.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
/**
 * Settles all pending bets for a specific finished match.
 * @param {Object} match - The match document that just finished.
 * @param {Object} io - Socket.io server instance for real-time notifications.
 */
export const settleBetsForMatch = async (match, io) => {
  try {
    const { _id: matchId, score } = match;
    // Determine winning selection
    let winningSelection = 'draw';
    if (score.home > score.away) {
      winningSelection = 'home';
    } else if (score.away > score.home) {
      winningSelection = 'away';
    }
    // Find all pending bets for this match
    const pendingBets = await Bet.find({ matchId, status: 'pending' });
    console.log(`Settling ${pendingBets.length} bets for match ${match.homeTeam} vs ${match.awayTeam}...`);
    for (const bet of pendingBets) {
      const user = await User.findById(bet.userId);
      if (!user) continue;
      if (bet.selection === winningSelection) {
        // User won
        bet.status = 'won';
        user.balance += bet.potentialPayout;
        
        await user.save();
        await bet.save();
        // Create transaction log
        const transaction = new Transaction({
          userId: user._id,
          type: 'bet_payout',
          amount: bet.potentialPayout,
          balanceAfter: user.balance,
          referenceId: bet._id,
        });
        await transaction.save();
        // Send real-time notification to user
        if (io) {
          io.to(user._id.toString()).emit('bet_settled', {
            betId: bet._id,
            status: 'won',
            selection: bet.selection,
            payout: bet.potentialPayout,
            newBalance: user.balance,
            matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
          });
        }
      } else {
        // User lost
        bet.status = 'lost';
        await bet.save();
        // Send real-time notification to user
        if (io) {
          io.to(user._id.toString()).emit('bet_settled', {
            betId: bet._id,
            status: 'lost',
            selection: bet.selection,
            matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error during bet settlement:', error);
  }
};
