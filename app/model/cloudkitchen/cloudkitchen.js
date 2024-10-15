//Require Mongoose
var mongoose = require('mongoose');
const { Address, Contact } = require('../common');

// Define a Schema for our CloudKitchen collection
const CloudKitchenSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    description: [String],
    allergenAdvice: [String],
    cuisines: [{
        type: String,
        ref: 'Cuisine'
    }],
    dishes: [{
        type: String,
        ref: 'Dish'
    }],
    url: { type: String, trim: true },
    slug: { type: String, trim: true },
    image: String,
    serviceAreas: [String],
    keywords: [String],
    deliveryFee: Number,
    freeDeliveryOver: Number,
    packagingFee: Number,
    minimumOrder: Number,
    minimumPartyOrder: Number,
    rating: Number,
    partyOrderLeadDays: Number,
    reviews: Number,
    doDelivery: Boolean,
    doPartyOrders: Boolean,
    partyDescription: [String],
    collectionTimings: [String],
    preOrderOnly: Boolean,
    open: Boolean,
    active: Boolean,
    contact: Contact,
    address: Address,
}, {
    timestamps: true
});
// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the collection your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model Tank is for the tanks collection in the database.
var CloudKitchen = mongoose.model('CloudKitchen', CloudKitchenSchema);

//Export function to create "CloudKitchen" model class
module.exports = CloudKitchen;