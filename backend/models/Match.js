import mongoose from 'mongoose';
const matchSchema = new mongoose.Schema(
  {
    sport: {
      type: String,
      required: true,
      enum: ['Football', 'Basketball', 'CS:GO', 'League of Legends'],
    },
    homeTeam: {
      type: String,
      required: true,
    },
    awayTeam: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['upcoming', 'live', 'finished'],
      default: 'upcoming',
    },
    score: {
      home: { type: Number, default: 0 },
      away: { type: Number, default: 0 },
    },
    odds: {
      home: { type: Number, default: 2.0 },
      draw: { type: Number, default: 3.0 }, // Can be null or unused for Basketball/Esports
      away: { type: Number, default: 2.0 },
    },
    gameTime: {
      type: Number,
      default: 0, // Time in minutes or rounds elapsed
    },
    maxTime: {
      type: Number,
      default: 90, // E.g., 90 mins for soccer, 48 mins for basketball, 30 rounds for CS:GO
    },
    timeline: [
      {
        time: Number,
        event: String,
      },
    ],
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);
const Match = mongoose.model('Match', matchSchema);
export default Match;
