//Require Mongoose
var mongoose = require('mongoose');
// Define a Schema for our Image collection
const CloudflareImageSchema = new mongoose.Schema({
    active: Boolean,
    cloudflareImageId: { type: String, trim: true },
    cloudflareImageFilename: { type: String, trim: true },
    cloudflareImageUrl: { type: String, trim: true },
    uploaded: Date,
    entity: { type: String, trim: true },
    entityId: { type: String, trim: true },
    
    slug: { type: String, trim: true },
}, {
    timestamps: true
});
// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the collection your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model Tank is for the tanks collection in the database.
var CloudflareImage = mongoose.model('CloudflareImage', CloudflareImageSchema);

//Export function to create "CloudflareImage" model class
module.exports = CloudflareImage;