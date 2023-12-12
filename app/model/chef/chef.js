//Require Mongoose
var mongoose = require('mongoose');
const { Address, Contact } = require('../common');
const uuid = require('node-uuid');

// Define a Schema for our Chef collection
const ChefSchema = new mongoose.Schema({
    _id: { type: String, default: uuid.v4 },
    name: { type: String, trim: true },
    kitchenName: { type: String, trim: true },
    description: [String],
    specials: [String],
    cuisines: [{
        type: String,
        ref: 'Cuisine'
    }],
    slots: [{
        type: String,
        ref: 'Slot'
    }],
    slug: { type: String, trim: true },
    coverPhoto: String,
    email: String,
    gallery: [String],
    serviceAreas: [{
        type: String,
        ref: 'LocalArea'
    }],
    categories: [String],
    keywords: [String],
    address: Address,
    deliveryFee: Number,
    freeDeliveryOver: Number,
    packagingFee: Number,
    deliveryMinimum: Number,
    deliveryDistance: Number,
    minimumOrder: Number,
    minimumPartyOrder: Number,
    rating: Number,
    reviews: Number,
    doDelivery: Boolean,
    doPartyOrders: Boolean,
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
var Chef = mongoose.model('Chef', ChefSchema);

//Export function to create "Chef" model class
module.exports = Chef;