import express from 'express';
import { auth } from '../middleware/auth.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
const router = express.Router();
// @route   POST api/wallet/deposit
// @desc    Deposit virtual funds
router.post('/deposit', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({ message: 'Invalid deposit amount' });
    }
    if (depositAmount > 10000) {
      return res.status(400).json({ message: 'Maximum single deposit is $10,000' });
    }
    const user = await User.findById(req.user._id);
    user.balance += depositAmount;
    await user.save();
    // Log transaction
    const transaction = new Transaction({
      userId: user._id,
      type: 'deposit',
      amount: depositAmount,
      balanceAfter: user.balance,
    });
    await transaction.save();
    res.json({
      message: 'Deposit successful',
      balance: user.balance,
      user,
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ message: 'Server error processing deposit' });
  }
});
// @route   POST api/wallet/withdraw
// @desc    Withdraw virtual funds
router.post('/withdraw', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({ message: 'Invalid withdrawal amount' });
    }
    const user = await User.findById(req.user._id);
    if (user.balance < withdrawAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    user.balance -= withdrawAmount;
    await user.save();
    // Log transaction
    const transaction = new Transaction({
      userId: user._id,
      type: 'withdrawal',
      amount: -withdrawAmount,
      balanceAfter: user.balance,
    });
    await transaction.save();
    res.json({
      message: 'Withdrawal successful',
      balance: user.balance,
      user,
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: 'Server error processing withdrawal' });
  }
});
// @route   GET api/wallet/transactions
// @desc    Get user's transactions
router.get('/transactions', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(transactions);
  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({ message: 'Server error fetching transactions' });
  }
});
export default router;