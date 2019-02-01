import mongoose from "mongoose";

let playerSchema = new mongoose.Schema({
  name: {type: String, required: true, unique: true},
  firstName: String,
  surname: String,
  maxFingers: { type: Number, default: 0 },
  maxCorrect: { type: Number, default: 0 },
  maxIncorrect: { type: Number, default: 0 },
  lastPlayed: Date
});

export default mongoose.model("Player", playerSchema);
