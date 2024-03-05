//Require Mongoose
var mongoose = require('mongoose');

// Define a Schema for PropertyEnquiry
const PropertyEnquirySchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    mobile: String,
    email: String,
    postcode: String,
    date: Date,
    enquiry: String,
    property: String
}, {
    timestamps: true
});

// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the collection your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model PropertyEnquiry is for the questions collection in the database.
var PropertyEnquiry = mongoose.model('PropertyEnquirySchema', PropertyEnquirySchema);

//Ensure mongoose automatically created _id field for the document
PropertyEnquiry._id instanceof mongoose.Types.ObjectId;

//Export function to create "PropertyEnquiry" model class
module.exports = PropertyEnquiry;