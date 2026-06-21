import mongoose from 'mongoose';
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    balance: {
      type: Number,
      default: 1000.0, // Default $1,000 in virtual credits
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);
// Remove sensitive data before returning user object
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};
const User = mongoose.model('User', userSchema);
export default User;
