//Require Mongoose
var mongoose = require('mongoose');
const uuid = require('node-uuid');
const { Extra } = require('../common');
// Define a Schema for our Food collection
const FoodSchema = new mongoose.Schema({
    chefId: { type: String, default: uuid.v4 },
    name: String,
    slug: String,
    category: String,
    image: String,
    price: Number,
    spice: Number,
    ourPrice: Number,
    extras: [Extra],
    choices: [Extra],
    vegetarian: Boolean,
    discounted: Boolean,
    discountedPrice: Number,
    description: String,
    active: Boolean
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