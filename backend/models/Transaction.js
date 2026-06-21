import mongoose from 'mongoose';
const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['deposit', 'withdrawal', 'bet_placed', 'bet_payout'],
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bet',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;