//Require Mongoose
var mongoose = require('mongoose');
// Define a Schema for our PostcodeDistrict collection
const PostcodeDistrictSchema = new mongoose.Schema({
    active: Boolean,
    // Generally area will be The City e,g G for Glasgow
    area: { type: String, trim: true },
    // G76
    prefix: { type: String, trim: true },
    // The localities e.g Clarkston, Waterfoot, Busby
    coverage: { type: String, trim: true },
    // The county e.g East Renfrewshire
    council: { type: String, trim: true },
    // The city.eg. Glasgow
    postTown: { type: String, trim: true },
    slug: { type: String, trim: true },
}, {
    timestamps: true
});
// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the collection your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model Tank is for the tanks collection in the database.
var PostcodeDistrict = mongoose.model('PostcodeDistrict', PostcodeDistrictSchema);

//Export function to create "PostcodeDistrict" model class
module.exports = PostcodeDistrict;