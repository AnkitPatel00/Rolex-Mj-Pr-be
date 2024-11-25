

const mongoose = require('mongoose');

const clothingSchema = new mongoose.Schema({
    title: { type: String, required: true },
    imgUrl: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 }, // Set a default value for discount
    rating: { type: Number, required: true },
    size: [{ type: String, enum: ["S", "M", "L", "XL", "XXL"] }],
    category: { type: String, enum: ["Men", "Women"] },
    description: { type: String },
}, { timestamps: true });



const Cloth = mongoose.model('ClothStore', clothingSchema); // Changed model name to follow naming conventions

module.exports = Cloth;
