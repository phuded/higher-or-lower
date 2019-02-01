import mongoose from "mongoose";

let gamePlayerSchema = new mongoose.Schema({
    name: String,
    active: {type: Boolean, default: true},
    stats: [Boolean]
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
}

export const GamePlayer = mongoose.model("GamePlayer", gamePlayerSchema);

export const Card = mongoose.model("Card", cardSchema);

export default mongoose.model("Game", gameSchema);
