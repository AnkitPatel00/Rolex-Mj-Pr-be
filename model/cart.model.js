const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema.Types

const cartSchema = mongoose.Schema({
  userId: { type: ObjectId, ref:"clothusers",required: true },
  clothsId: { type: ObjectId, ref: "ClothStore" },
  quantity: { type: Number },
  size:{type:String}
})

const CartModel = mongoose.model('clothcarts', cartSchema)

module.exports = CartModel