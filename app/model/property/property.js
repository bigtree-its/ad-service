//Require Mongoose
var mongoose = require('mongoose');
//Mongoose Paginate V2
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
const { NameValue, Address, Sale, Rental, Contact, School, SuperStore } = require('./all-properties');

// Define a Schema for our property collection
const PropertySchema= new mongoose.Schema({
    title: String, // property name
    type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PropertyType'
    },
    tenure: { type: String, enum: ['Freehold', 'Leasehold', 'Shared'] },
    consumptionType: { type: String, enum: ['Sale', 'Rent'] },
    status: { type: String, enum: ['Under Offer', 'Available', 'Let Agreed', 'Sold'] },
    pin: String, // Property Identification Number
    description: [String],
    keyFeatures: [String],
    summary: String,
    tags: [String],
    schools: [School],
    superStores: [SuperStore],
    stations: [NameValue],
    hospitals: [NameValue],
    shops: [NameValue],
    parks: [NameValue],
    malls: [NameValue],
    leisureCenters: [NameValue],
    coverPhoto: String,
    floorPlan: [String],
    gallery: [String],
    sale: Sale,
    rental: Rental,
    bathrooms: Number,
    bedrooms: Number, 
    size: String, 
    addedDate: Date,
    availableDate: Date,
    liveDate: Date,
    address: Address,
    contact: Contact,
    featured: Boolean,
}, {
    timestamps: true
});

PropertySchema.plugin(aggregatePaginate);

// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the collection your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model Tank is for the tanks collection in the database.
var property = mongoose.model('property', PropertySchema);
//Ensure mongoose automatically created _id field for the document
property._id instanceof mongoose.Types.ObjectId;

//Export function to create "property" model class
module.exports = property;