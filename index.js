const mongoose = require('mongoose')
const {initializeDatabase} =require('./db/db.connect')
const Cloth = require('./model/clothing.model')
const CartModel = require('./model/cart.model')
const UserModel = require('./model/user.model')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const JWT_KEY = process.env.JWT_KEY

require('dotenv').config()

const express = require('express')
const app = express()
app.use(express.json())
const cors = require('cors')
const AddressModel = require('./model/address.model')
const WishlistModel = require('./model/wishlist.model')
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus:200
}
app.use(cors(corsOptions))

initializeDatabase()

app.get('/', (req,res) => {
    res.send("Hello Clothing Server")  
})

// ************ JWT Middleware ***********

// jwt auth

const jwtAuth = async (req, res, next) => {
  const token = req.headers["authorization"]
  if (!token)
  {
   return res.status(401).json({error:'token require'})
  }
  try
  {
    const decodedToken = jwt.verify(token, JWT_KEY)
    req.user = decodedToken
    next()
  }
  catch (error)
  {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    }
return res.status(500).json({error:'failed to Authenticate'})
  }
}

// ************ Cloths ***********

//add one cloth - done

app.post("/api/cloths/add/single",async (req,res) => {
  try {
    const newCloth = new Cloth(req.body)
    const savedCloth = await newCloth.save()
    if (!savedCloth)
    {
      return res.status(500).json({error:"error in saving single cloth"})
    }
    res.status(201).json(savedCloth)
  }
  catch (error)
  {
res.status(500).json({error:"Failed to add single cloth"})
  }
})

//add multiple cloths - done

app.post("/api/cloths/add/multiple",async (req,res) => {
  try {
    const newCloths = await Cloth.insertMany(req.body)
    if (!newCloths)
    {
      return res.status(500).json({error:"error in saving All cloth"})
    }
    res.status(201).json(newCloths)
  }
  catch (error)
  {
res.status(500).json({error:"Failed to add All cloth"})
  }
})

//delete all cloths - done

app.delete("/api/cloths/delete/all",async (req,res) => {
  try {
    const deletedCloths = await Cloth.deleteMany()
    if (!deletedCloths)
    {
      return res.status(500).json({error:"error in Deleting All cloth"})
    }
    res.status(200).json(deletedCloths)
  }
  catch (error)
  {
res.status(500).json({error:"Failed to Delete All cloth"})
  }
})

//read all cloths

app.get("/api/cloths/get/all",async (req,res) => {
  try {
    const cloths = await Cloth.find()
    if (cloths.length === 0) {
      return res.status(500).json({ error: "Not Cloths in Stock" })
    }
    res.status(200).json({
      data: {
        products: cloths
      }
    })
  }
  catch (error)
  {
res.status(500).json({error:"Failed to Fetch All cloth"})
  }
})


// ************ Users ***********

//add user

app.post("/api/users/register", async (req, res) => {
  const {password,...rest} = req.body
  try {


    const alreadyUsedUsername = await UserModel.findOne({ username: rest.username })
    if (alreadyUsedUsername)
    {
      return res.status(500).json({error:"Username is Already Registered Please Login"}) 
    }

    const alreadyUsedEmail = await UserModel.findOne({ email: rest.email })
    if (alreadyUsedEmail)
    {
      return res.status(500).json({error:"Email is Already Registered Please Login"}) 
    }

const saltCount =await bcrypt.genSalt(10)
    const hashedPassword =await bcrypt.hash(password,saltCount)

    const newUser = new UserModel({...rest,password:hashedPassword})

    const savedUser = await newUser.save()
    if (!savedUser)
    {
return res.status(500).json({error:"error in saving User"}) 
    }
    res.status(201).json({message:`Congratulations! ${savedUser.username} is Registered Please Login With Email`})
  }
  catch (error)
  {
   res.status(500).json({error:"Failed to add User"}) 
  }
})

//update user

app.post('/api/users/profile/update',jwtAuth,async (req,res) => {
  const userUpdateData = req.body
  const {id} = req.user
  try {


    const isUsername = await UserModel.findOne({ username: userUpdateData.username })


    //username exist ?
    
    if (isUsername)
    {
          if ((isUsername._id).toString() !== id)
    {
return res.status(409).json({error:"Username Already Regsiterd"}) 
    }
    }
    
    const isEmail = await UserModel.findOne({ email: userUpdateData.email })
    
    //email exist ?
    
    if (isEmail)
    {
          if ((isEmail._id).toString() !== id)
    {
return res.status(409).json({error:"Email Already Regsiterd"}) 
    }
    }
    
    const userHashedPassword = await UserModel.findById(id)

    const isPasswordMatch = await bcrypt.compare(userUpdateData.password, userHashedPassword.password)
    
    
    if (!isPasswordMatch)
    { 

     return res.status(409).json({ error:"Creadential Incorrect"})

    }

 
    if (isPasswordMatch)
    {

      const {password,...rest} =userUpdateData

      const updatedUserData = await UserModel.findByIdAndUpdate(id, {...rest}, { new: true })
      
          const userUpdatedDataWithoutPassword = updatedUserData.toObject()
      delete userUpdatedDataWithoutPassword.password
    
   return  res.status(200).json(userUpdatedDataWithoutPassword)

    }

  }
  catch (error)
  {
    res.status(500).json({error:"Failed to update User"})
  }
})


//login user

app.post('/api/users/login',async (req, res) => {
  const { email, password } = req.body
  try {

    const user =await UserModel.findOne({email})

    if (!user)
    {
     return res.status(401).json({error:'User Not Found'})
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch)
    {
      return res.status(401).json({error:'Creadential Incorrect'})
    }

    const userInfo = user.toObject()
    delete userInfo.password
 

    const token = jwt.sign({ id: user.id },JWT_KEY, { expiresIn: '24h' })

    res.status(200).json({token,user:userInfo})
  }
  catch (error)
  {
res.status(500).json({error:'Failed to Login'})
  }
})

//get user information with authetication

app.get('/api/user/profile/get',jwtAuth,async(req,res) => {
  const { id } = req.user
  try {
    const user = await UserModel.findById(id)
    if (!user)
    {
     return res.status(500).json({error:'User Not Found'})
    }
    res.send(user)
  }
  catch (error)
  {
    res.status(500).json({error:'cant get User'})
  }

})

//****************** Address ***************/

//add address with user id

app.post('/api/users/profile/address/add',jwtAuth,async (req, res) => {
  const address = req.body
  try {

    const addressLimit = await AddressModel.find()
    
    if (addressLimit.length >= 5)
    {
 return res.status(409).json({ message: 'Address limit reached. You can only have up to 5 addresses.' });
    }

    const newAddress = new AddressModel(address)
    const savedAddress = await newAddress.save()
    if (!savedAddress)
    {
     return res.status(401).json({ error: 'error in saving user address'});
    }

    res.status(201).json(savedAddress)
  }
  catch (error)
  {
res.status(500).json({ error: 'failed to add user adreess'});
  }
})

//update address

app.post('/api/users/profile/address/update/', jwtAuth, async (req, res) => {
  const {addressId,...rest} = req.body
  try {
    const updatedAddress = await AddressModel.findByIdAndUpdate(addressId,rest, { new: true })
    if (!updatedAddress)
    {
     return res.status(404).json({error: 'address not found'});
    }
    
    res.status(200).json(updatedAddress)
    
  }
  catch (error)
  {
    res.status(500).json({ error: 'failed to update user adreess'});
  }
})

//address set as default

app.post('/api/users/profile/address/setdefault', jwtAuth, async (req, res) => {
  const { id } = req.user
  const {addressId} = req.body
  try {
    const setAllFalse = await AddressModel.updateMany({ userId: id }, { $set: { setasDefault: false } })
    
     if (!setAllFalse)
    {
return res.status(500).json({error:"error in set all address as default false "})
    }
    
    const setDefault = await AddressModel.findByIdAndUpdate(addressId, { setasDefault: true },{new:true})
    
      if (!setDefault)
    {
return res.status(500).json({error:"error in set to default address"})
    }

    const allAddress = await AddressModel.find({ userId: id })
    if (!allAddress)
    {
return res.status(404).json({error:"address not found"})
    }

    res.status(200).json(allAddress)


  }
  catch (error)
  {
    res.status(500).json({ error: 'failed to set default user adreess'});
  }
})


//delete address

app.post('/api/users/profile/address/delete', jwtAuth, async (req, res) => {
  const {addressId} = req.body
  try {
    const updatedAddress = await AddressModel.findByIdAndDelete(addressId)
    if (!updatedAddress)
    {
     return res.status(404).json({error: 'address not found'});
    }
    
    res.status(200).json(updatedAddress)
    
  }
  catch (error)
  {
    res.status(500).json({ error: 'failed to delete user adreess'});
  }
})



//add address with user id

app.post('/api/users/profile/address/add',async (req, res) => {
  const address = req.body
  try {
    const newAddress = new AddressModel(address)
    const savedAddress = await newAddress.save()
    if (!savedAddress)
    {
     return res.status(401).json({ error: 'error in saving user address'});
    }

    res.status(201).json(savedAddress)
  }
  catch (error)
  {
res.status(500).json({ error: 'failed to add user adreess'});
  }
})


//get address with user id

app.get('/api/users/profile/address/get',jwtAuth,async (req, res) => {
  const userId  = req.user.id
  try {
    const address = await AddressModel.find({ userId })
    if (!address)
    {
     return res.status(404).json({ error: 'address not found' });
    }

    res.status(200).json(address)
  }
  catch (error)
  {
     res.status(500).json({ error: 'failed to get user address' });
  }
})


// ************ Wishlist ***********

//add single items to wishlist

app.post('/api/users/wishlist/add',jwtAuth,async(req, res) => {
  const {  clothsId } = req.body
  const {id} = req.user
  try {
    const alreadyinWishlist = await WishlistModel.findOne({ userId:id,clothsId })
    if (alreadyinWishlist)
    {  
        return res.status(409).json({ error: 'Item already in Wishlist' });
    }
    const newWishlistItem = new WishlistModel({ userId:id, clothsId })
    const savedWishlistItem = await newWishlistItem.save()
    if (!savedWishlistItem)
    {
     return res.status(400).json({ error: 'error in saving wishlist item' });
    }
      const populatedWishlistItem = await WishlistModel.findById(savedWishlistItem._id).populate('clothsId');
    res.status(201).json(populatedWishlistItem);
  }
  catch (error)
  {  
     res.status(500).json({ error: 'failed to add item in wishlist' });
  }
})

//get all wishlist items with auth id

app.get('/api/users/wishlist/get/all', jwtAuth, async (req, res) => {
  const { id } = req.user
  try {
    const wishlistItems = await WishlistModel.find({ userId: id })
    res.json(wishlistItems)
  }
  catch (error)
  {
     res.status(500).json({ error: 'failed get all item from wishlist' });
  }
})

//populate cloths

app.get('/api/users/wishlist/get/all/populate', jwtAuth, async (req, res) => {
  const { id } = req.user
  try {
    const wishlistItems = await WishlistModel.find({ userId: id }).populate('clothsId')
    res.json(wishlistItems)
  }
  catch (error)
  {
     res.status(500).json({ error: 'failed get all item from wishlist' });
  }
})

//remove single item from wishlist

app.delete("/api/users/wishlist/remove", jwtAuth, async (req, res) => {
  const { clothsId } = req.body
   const { id } = req.user
  try {
    const deletedWishlistItem = await WishlistModel.findOneAndDelete({ clothsId ,userId:id})
    if (!deletedWishlistItem)
    {
return res.status(200).json({message: 'wishlist Item not found' });
    }
    res.status(200).json(deletedWishlistItem)
  }
  catch (error)
  {
    res.status(500).json({ error: 'failed to delete wishlist Item' });
  }
})

//remove all from wishlist

app.delete("/api/users/wishlist/remove/all", jwtAuth, async (req, res) => {

  try {
    const deletedWishlistItems = await WishlistModel.deleteMany()
    if (!deletedWishlistItems)
    {
return res.status(404).json({ error: 'wishlist Items not found' });
    }
    res.status(200).json(deletedWishlistItems)
  }
  catch (error)
  {
    res.status(500).json({ error: 'failed to delete all wishlists Item' });
  }
})



// ************ Cart ***********

//get cart items

app.get('/api/users/cart/get/all', jwtAuth, async (req, res) => {
  const { id } = req.user
  try {
    const cartItems = await CartModel.find({ userId: id })
    res.json(cartItems)
  }
  catch (error)
  {
     res.status(500).json({ error: 'failed get all item from cart' });
  }
})

//populate

app.get('/api/users/cart/get/all/populate', jwtAuth, async (req, res) => {
  const { id } = req.user;
  try {
    const cartItems = await CartModel.find({ userId: id }).populate('clothsId'); // Populate clothsId
    res.json(cartItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get all items from cart' });
  }
});


//add to cart

app.post('/api/users/cart/add', jwtAuth, async (req, res) => {
   const {  clothsId ,...rest} = req.body
  const {id} = req.user
  try {
    const alreadyinCart = await CartModel.findOne({ userId:id,clothsId })
    if (alreadyinCart)
    {  
        return res.status(409).json({ error: 'Item already in Cart' });
    }
    const newCartItem = new CartModel({ userId: id, clothsId, ...rest })
    const savedCartItem = await newCartItem.save()
    if (!savedCartItem)
    {
     return res.status(400).json({ error: 'error in saving Cart item' });
    }

    const populateCartItems = await CartModel.findById(savedCartItem._id).populate('clothsId')
    
    res.status(201).json(populateCartItems)
  }
  catch (error)
  {  
     res.status(500).json({ error: 'failed to add item in Cart' });
  }

})

app.delete("/api/users/cart/remove", jwtAuth, async (req, res) => {
  const { clothsId } = req.body
    const {id} = req.user
  try {
    const deletedCartItem = await CartModel.findOneAndDelete({ clothsId,userId:id })
    if (!deletedCartItem)
    {
return res.status(404).json({error: 'cart Item not found' });
    }
    res.status(200).json(deletedCartItem)
  }
  catch (error)
  {
    res.status(500).json({ error: 'failed to delete cart Item' });
  }
})

//Update Cart

app.post('/api/users/cart/update', jwtAuth, async (req,res) => {
  const { clothsId,...rest} = req.body
  const { id } = req.user
  try {
    const updatedCart = await CartModel.findOneAndUpdate({ userId: id ,clothsId},{...rest},{new:true})
    
    if (!updatedCart)
    {
     return res.json(400).json({error:"error in updating cart"})
    }

    res.status(200).json(updatedCart)

  }
  catch (error)
  {
    res.status(500).json({ error: 'failed to Update cart Item' });
  }
})


const PORT =process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on Port ${PORT}`)
})
