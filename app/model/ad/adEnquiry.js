//Require Mongoose
var mongoose = require('mongoose');
const { Customer, AdOwner, EnquiryResponse } = require('../common/modals');
// Define a Schema for our AdEnquiry collection
const AdEnquirySchema = new mongoose.Schema({
    category: { type: String, trim: true },
    reference: { type: String, trim: true },
    message: { type: String, trim: true },
    customer: Customer,
    adOwner: AdOwner,
    responses: [EnquiryResponse],
    date: Date,
}, {
    timestamps: true
});
// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the collection your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model Tank is for the tanks collection in the database.
var AdEnquiry = mongoose.model('AdEnquiry', AdEnquirySchema);

//Export function to create "AdEnquiry" model class
module.exports = AdEnquiry;