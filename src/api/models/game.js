import mongoose from "mongoose";

let gamePlayerStatsSchema = new mongoose.Schema({
    guesses: [Boolean],
    numCorrectGuesses: {type: Number, default: 0},
    numIncorrectGuesses: {type: Number, default: 0},
    percentageCorrect: {type: String, default: "0.0"},
    correctGuessStreak: {type: Number, default: 0},
    incorrectGuessStreak: {type: Number, default: 0},
    fingersDrank: {type: Number, default: 0}
});

let gamePlayerSchema = new mongoose.Schema({
    name: String,
    rank: Number,
    active: {type: Boolean, default: true},
    stats: {type: gamePlayerStatsSchema, default: gamePlayerStatsSchema}
});

let cardSchema = new mongoose.Schema({
    suit: String,
    value: Number
});

let gameSchema = new mongoose.Schema({
    name: {type: String, required: true},
    owner: String,
    players: [gamePlayerSchema],
    currentPlayerName: String,
    status: {type: Boolean, default: null},
    cards: [cardSchema],
    playAsAnyone: Boolean,
    removeCards: Boolean,
    wholePack: Boolean,
    betAnyCard: Boolean,
    limitBetsToOne: Boolean,
    currentCard: cardSchema,
    bet: {type: Number, default: 0},
    fingersToDrink: {type: Number, default: 0},
    drinkType: String,
    cardsLeft: Number
});

gameSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.cards;
    return obj;
};

export const GamePlayerStats = mongoose.model("GamePlayerStats", gamePlayerStatsSchema);

export const GamePlayer = mongoose.model("GamePlayer", gamePlayerSchema);

export const Card = mongoose.model("Card", cardSchema);

export default mongoose.model("Game", gameSchema);
