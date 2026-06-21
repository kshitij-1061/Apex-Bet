import express from 'express';
import { auth } from '../middleware/auth.js';
import User from '../models/User.js';
import Match from '../models/Match.js';
import Bet from '../models/Bet.js';
import Transaction from '../models/Transaction.js';
const router = express.Router();
// @route   POST api/bets/place
// @desc    Place a bet
router.post('/place', auth, async (req, res) => {
  try {
    const { matchId, selection, stake } = req.body;
    const betStake = parseFloat(stake);
    if (!matchId || !selection || isNaN(betStake) || betStake <= 0) {
      return res.status(400).json({ message: 'Invalid bet placement fields' });
    }
    if (!['home', 'draw', 'away'].includes(selection)) {
      return res.status(400).json({ message: 'Invalid selection' });
    }
    // Verify Match exists and is bettable (upcoming or live)
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    if (match.status === 'finished') {
      return res.status(400).json({ message: 'Match has already finished' });
    }
    // Get current odds for the selection
    const odds = match.odds[selection];
    if (!odds || odds <= 1) {
      return res.status(400).json({ message: 'Odds are not available for this selection' });
    }
    const user = await User.findById(req.user._id);
    if (user.balance < betStake) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }
    // Deduct stake and save user balance
    user.balance -= betStake;
    await user.save();
    // Calculate potential payout
    const potentialPayout = Math.round(betStake * odds * 100) / 100;
    // Create and save the Bet
    const bet = new Bet({
      userId: user._id,
      matchId: match._id,
      selection,
      oddsAtPlacement: odds,
      stake: betStake,
      potentialPayout,
      status: 'pending',
    });
    await bet.save();
    // Log the transaction
    const transaction = new Transaction({
      userId: user._id,
      type: 'bet_placed',
      amount: -betStake,
      balanceAfter: user.balance,
      referenceId: bet._id,
    });
    await transaction.save();
    // Return the response, populating the match details in the bet response
    const populatedBet = await Bet.findById(bet._id).populate('matchId');
    res.status(201).json({
      message: 'Bet placed successfully',
      bet: populatedBet,
      balance: user.balance,
    });
  } catch (error) {
    console.error('Place bet error:', error);
    res.status(500).json({ message: 'Server error placing bet' });
  }
});
// @route   GET api/bets
// @desc    Get user's bets
router.get('/', auth, async (req, res) => {
  try {
    const bets = await Bet.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(bets);
  } catch (error) {
    console.error('Get bets error:', error);
    res.status(500).json({ message: 'Server error fetching bets' });
  }
});
export default router; 