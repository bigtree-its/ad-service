//Require Mongoose
var mongoose = require('mongoose');
const { Address, Contact } = require('../common');
const uuid = require('node-uuid');

// Define a Schema for our LocalChef collection
const LocalChefSchema = new mongoose.Schema({
    _id: {type: String, default: uuid.v4},
    name: { type: String, trim: true },
    displayName: { type: String, trim: true },
    description: [String],
    specials: [String],
    cuisines: [{
        type: String,
        ref: 'Cuisine'
    }],
    slug: { type: String, trim: true },
    coverPhoto: String,
    gallery: [String],
    serviceAreas: [{
        type: String,
        ref: 'LocalArea'
    }],
    categories: [String],
    slots: [String], // [Lunch, breakfast, Dinner, AllDay]
    address: Address,
    deliveryFee: Number,
    packagingFee: Number,
    minimumOrder: Number,
    minimumOrder: Number,
    collectionPolicy: String,
    deliveryPolicy: String,
    rating: Number,
    reviews: Number,
    noMinimumOrder: Boolean,
    preOrder: Boolean,
    delivery: Boolean,
    takingOrdersNow: Boolean,
    collectionOnly: Boolean,
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
var LocalChef = mongoose.model('LocalChef', LocalChefSchema);

//Export function to create "LocalChef" model class
module.exports = LocalChef;