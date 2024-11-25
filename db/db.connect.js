const mongoose = require('mongoose')
require('dotenv').config()
const mongoURI = process.env.mongoURI
const initializeDatabase =async () => {
  try {
    const connection =await mongoose.connect(mongoURI)
    if (connection)
    {
      console.log('connected successfully')
  }
  }
  catch (error)
  {
console.log('connection failed:',error)
  }
}

module.exports = {initializeDatabase}