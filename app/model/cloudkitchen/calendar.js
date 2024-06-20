//Require Mongoose
var mongoose = require('mongoose');

// Define a Schema for our Calendar collection
const CalendarSchema = new mongoose.Schema({
    cloudKitchenId: { type: String, trim: true },
    date: Date,
    description: [String],
    foods: [{
        type: String,
        ref: 'Food'
    }]
}, {
    timestamps: true
});
// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the collection your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model Tank is for the tanks collection in the database.
var Calendar = mongoose.model('Calendar', CalendarSchema);

//Export function to create "Calendar" model class
module.exports = Calendar;