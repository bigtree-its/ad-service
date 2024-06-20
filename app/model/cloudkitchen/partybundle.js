//Require Mongoose
var mongoose = require('mongoose');
const { Extra } = require('../common');
const { PartyBundleCandidate } = require('./common');
// Define a Schema for our PartyBundle collection
const PartyBundleSchema = new mongoose.Schema({
    cloudKitchenId: String,
    collectionId: String,
    name: String,
    slug: String,
    price: Number,
    partyBundleCandidates: [PartyBundleCandidate],
    extras: [Extra],
    vegetarian: Boolean,
    discounted: Boolean,
    discountedPrice: Number,
    description: String,
    active: Boolean,
}, {
    timestamps: true
});
// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the collection your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model Tank is for the tanks collection in the database.
var PartyBundle = mongoose.model('PartyBundle', PartyBundleSchema);

//Export function to create "PartyBundle" model class
module.exports = PartyBundle;