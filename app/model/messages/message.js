//Require Mongoose
var mongoose = require('mongoose');
const { Customer } = require('../common/modals');
// Define a Schema for our Message collection
const MessageSchema = new mongoose.Schema({
    reason: { type: String, trim: true },
    reference: { type: String, trim: true },
    message: { type: String, trim: true },
    customer: Customer,
    date: Date,
}, {
    timestamps: true
});
// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the collection your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model Tank is for the tanks collection in the database.
var Message = mongoose.model('Message', MessageSchema);

//Export function to create "Message" model class
module.exports = Message;