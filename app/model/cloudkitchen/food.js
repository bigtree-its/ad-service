//Require Mongoose
var mongoose = require('mongoose');
const { Extra } = require('../common');
const { Kitchen } = require('./common');
// Define a Schema for our Food collection
const FoodSchema = new mongoose.Schema({
    kitchen: Kitchen,
    collectionId: String,
    keywords: [String],
    calendarId: String,
    name: String,
    slug: String,
    image: String,
    price: Number,
    offerPrice: Number,
    spice: Number,
    extras: [Extra],
    choices: [Extra],
    vegetarian: Boolean,
    special: Boolean,
    discounted: Boolean,
    discountedPrice: Number,
    description: String,
    preOrder: Boolean,
    orderBefore: Number,
    orderBeforeUnit: String,
    onOffer: Boolean,
    partyCandidate: Boolean,
    partyDescription: String,
    readyBy: Date,
    orderBy: Date,
    collectionOnly: Boolean,
    active: Boolean,
}, {
    timestamps: true
});
// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the collection your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model Tank is for the tanks collection in the database.
var Food = mongoose.model('Food', FoodSchema);

//Export function to create "Food" model class
module.exports = Food;