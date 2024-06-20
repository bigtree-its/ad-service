//Require Mongoose
var mongoose = require('mongoose');

const { Customer } = require('../common/modals');
// Define a Schema for our Question collection
const QuestionSchema = new mongoose.Schema({
    _id: { type: String, trim: true },
    product: { type: String, trim: true },
    query: String,
    date: Date
}, {
    timestamps: true
});
// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the collection your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model Tank is for the tanks collection in the database.
var Question = mongoose.model('Question', QuestionSchema);

//Export function to create "Question" model class
module.exports = Question;