const mongoose = require('mongoose');
const {ObjectId} = mongoose.Schema.Types

// Address schema
const addressSchema = new mongoose.Schema({
  userId:{type:ObjectId,ref:"UserModel"},
    flatHouseNoBuildingCompanyApartment: { type: String, required: true },
    areaStreetSectorVillage: { type: String, required: true },
    landmark: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    pincode: { type: Number, required: true }, 
    setasDefault: { type: Boolean, default: false }
});



// Create the model
const AddressModel = mongoose.model('clothusersaddress', addressSchema);

module.exports = AddressModel;