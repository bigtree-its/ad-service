//Require Mongoose
var mongoose = require('mongoose');
// Define a Schema for our Image collection
const ImageSchema = new mongoose.Schema({
    active: Boolean,
    reference: { type: String, trim: true },
    fileId: { type: String, trim: true },
    name: { type: String, trim: true },
    url: { type: String, trim: true },
    thumbnail: { type: String, trim: true },
}, {
    timestamps: true
});
// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the collection your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model Tank is for the tanks collection in the database.
var Image = mongoose.model('Image', ImageSchema);

//Export function to create "Image" model class
module.exports = Image;