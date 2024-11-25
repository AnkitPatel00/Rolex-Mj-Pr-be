const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    firstname: { type: String, required: true }, 
    lastname: { type: String, required: true},
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mobilenumber: { type: Number, required: true },
}, { timestamps: true });

const UserModel = mongoose.model('clothusers', userSchema);

module.exports = UserModel;
