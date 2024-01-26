//Require Mongoose
var mongoose = require('mongoose');
const uuid = require('node-uuid');
const { Customer } = require('../common');
// Define a Schema for our Review collection
const ReviewSchema = new mongoose.Schema({
    _id: { type: String, default: uuid.v4 },
    chefId: { type: String, default: uuid.v4 },
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
var Review = mongoose.model('Review', ReviewSchema);

//Export function to create "Review" model class
module.exports = Review;