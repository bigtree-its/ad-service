//Require Mongoose
var mongoose = require('mongoose');
const { Address, Contact } = require('../common');
const uuid = require('node-uuid');

// Define a Schema for our Supplier collection
const SupplierSchema = new mongoose.Schema({
    _id: { type: String, default: uuid.v4 },
    name: { type: String, trim: true },
    tradingName: { type: String, trim: true },
    description: [String],
    coverPhoto: String,
    email: String,
    gallery: [String],
    address: Address,
    deliveryFee: Number,
    freeDeliveryOver: Number,
    packagingFee: Number,
    deliveryMinimum: Number,
    deliveryDistance: Number,
    minimumOrder: Number,
    rating: Number,
    reviews: Number,
    doDelivery: Boolean,
    preOrderOnly: Boolean,
    paymentRequireApproval: Boolean,
    active: Boolean,
    contact: Contact,
}, {
    timestamps: true
});
// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the collection your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model Tank is for the tanks collection in the database.
var Supplier = mongoose.model('Supplier', SupplierSchema);

//Export function to create "Supplier" model class
module.exports = Supplier;