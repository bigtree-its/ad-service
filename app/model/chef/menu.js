//Require Mongoose
var mongoose = require('mongoose');
const uuid = require('node-uuid');
const { Extra } = require('../common');
// Define a Schema for our Menu collection
const MenuSchema = new mongoose.Schema({
    chefId: { type: String, default: uuid.v4 },
    collectionId: { type: String, default: uuid.v4 },
    name: String,
    slug: String,
    image: String,
    price: Number,
    spice: Number,
    extras: [Extra],
    choices: [Extra],
    vegetarian: Boolean,
    special: Boolean,
    discounted: Boolean,
    discountedPrice: Number,
    description: String,
    active: Boolean,
    preOrder: Boolean,
    partyCandidate: Boolean,
    partyDescription: String,
    readyBy: Date,
    orderBy: Date,
    collectionOnly: Boolean,
}, {
    timestamps: true
});
// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the collection your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model Tank is for the tanks collection in the database.
var Menu = mongoose.model('Menu', MenuSchema);

//Export function to create "Menu" model class
module.exports = Menu;