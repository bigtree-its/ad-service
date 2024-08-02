//Require Mongoose
var mongoose = require('mongoose');
// Define a Schema for our Collection collection
const CollectionSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    cloudKitchenId: { type: String, trim: true },
    slug: { type: String, trim: true },
    image: { type: String, trim: true },
    readyBy: Date,
    orderBy: Date,
    timeBound: Boolean,
}, {
    timestamps: true
});
// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the collection your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model Tank is for the tanks collection in the database.
var Collection = mongoose.model('Collection', CollectionSchema);

//Export function to create "Collection" model class
module.exports = Collection;