//Require Mongoose
var mongoose = require('mongoose');
const { Address, Contact, OkDay } = require('../common');

// Define a Schema for our Supplier collection
const SupplierSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    description: [String],
    slug: { type: String, trim: true },
    image: String,
    serviceAreas: [String],
    keywords: [String],
    deliveryFee: Number,
    freeDeliveryOver: Number,
    packagingFee: Number,
    minimumOrder: Number,
    rating: Number,
    reopen: Date,
    reviews: Number,
    doDelivery: Boolean,
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
var Supplier = mongoose.model('Supplier', SupplierSchema);

//Export function to create "Supplier" model class
module.exports = Supplier;