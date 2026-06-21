import mongoose from 'mongoose';
const betSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
    },
    selection: {
      type: String,
      required: true,
      enum: ['home', 'draw', 'away'],
    },
    oddsAtPlacement: {
      type: Number,
      required: true,
      min: 1.01,
    },
    stake: {
      type: Number,
      required: true,
      min: 1.0,
    },
    potentialPayout: {
      type: Number,
      required: true,
      min: 1.01,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'won', 'lost'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);
// Populate match info by default
betSchema.pre('find', function () {
  this.populate('matchId');
});
betSchema.pre('findOne', function () {
  this.populate('matchId');
});
const Bet = mongoose.model('Bet', betSchema);
export default Bet;