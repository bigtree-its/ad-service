//Require Mongoose
var mongoose = require('mongoose');
// Define a Schema for our Dish collection
const DishSchema = new mongoose.Schema({
    active: Boolean,
    name: { type: String, trim: true },
    slug: { type: String, trim: true },
    image: { type: String, trim: true },
    searchCount: Number
}, {
    timestamps: true
});
// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the collection your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model Tank is for the tanks collection in the database.
var Dish = mongoose.model('Dish', DishSchema);

//Export function to create "Dish" model class
module.exports = Dish;