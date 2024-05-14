//Require Mongoose
var mongoose = require('mongoose');
const uuid = require('node-uuid');
const { Address } = require('../property/all-properties');
const { AdOwner } = require('../common/modals');
// Define a Schema for our Ad collection
const AdSchema = new mongoose.Schema({
    _id: { type: String, default: uuid.v4 },
    category: { type: String, trim: true },
    title: { type: String, trim: true },
    description: [String],
    keyFeatures: [String],
    address: Address,
    image: { type: String, trim: true },
    gallery: [String],
    price: Number,
    adOwner: AdOwner,
    datePosted: Date,
    dateAvailable: Date,
    featured: Boolean,
    approved: Boolean,
    active: Boolean,
    slug: { type: String, trim: true },
}, {
    timestamps: true
});
// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the collection your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model Tank is for the tanks collection in the database.
var Ad = mongoose.model('Ad', AdSchema);

//Export function to create "Ad" model class
module.exports = Ad;