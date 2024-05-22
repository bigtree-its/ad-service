//Require Mongoose
var mongoose = require('mongoose');
const uuid = require('node-uuid');
// Define a Schema for our Cuisine collection
const CuisineSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    image: { type: String, trim: true },
    slug: { type: String, trim: true },
    logo: String,
}, {
    timestamps: true
});
// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the collection your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model Tank is for the tanks collection in the database.
var Cuisine = mongoose.model('Cuisine', CuisineSchema);

//Export function to create "Cuisine" model class
module.exports = Cuisine;