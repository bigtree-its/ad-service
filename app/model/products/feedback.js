//Require Mongoose
var mongoose = require('mongoose');

const { Customer } = require('../common/modals');
// Define a Schema for our Feedback collection
const FeedbackSchema = new mongoose.Schema({
    _id: { type: String, trim: true },
    product: { type: String, trim: true },
    rating: Number,
    title: String,
    comment: String,
    customer: Customer,
    order: { type: String, trim: true },
    date: Date
}, {
    timestamps: true
});
// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the collection your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model Tank is for the tanks collection in the database.
var Feedback = mongoose.model('Feedback', FeedbackSchema);

//Export function to create "Feedback" model class
module.exports = Feedback;