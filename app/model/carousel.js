//Require Mongoose
var mongoose = require('mongoose');

// Define a Schema for our Carousel collection
const CarouselSchema = new mongoose.Schema({
    property: String,
    image: String,
    title: String,
    description: String,
    active: Boolean,
    coming: Boolean,
}, {
    timestamps: true
});
// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the collection your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model Tank is for the tanks collection in the database.
var Carousel = mongoose.model('Carousel', CarouselSchema);
//Ensure mongoose automatically created _id field for the document
Carousel._id instanceof mongoose.Types.ObjectId;

//Export function to create "Carousel" model class
module.exports = Carousel;