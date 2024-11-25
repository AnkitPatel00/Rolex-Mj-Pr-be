const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema.Types
const wishlistSchema = mongoose.Schema({

  userId: { type: ObjectId, ref:"clothusers",required: true },
  clothsId: { type:ObjectId,ref:"ClothStore"},
})

const WishlistModel = mongoose.model('clothwishlist', wishlistSchema)

module.exports = WishlistModel