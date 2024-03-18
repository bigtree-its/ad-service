//Require Mongoose
var mongoose = require('mongoose');
const uuid = require('node-uuid');
// Define a Schema for our Group collection
const GroupSchema = new mongoose.Schema({
    _id: { type: String, default: uuid.v4 },
    name: String,
    department: String,
    slug: String,
    image: String,
    active: Boolean
}, {
    timestamps: true
});
// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the Group your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model Tank is for the tanks Group in the database.
var Group = mongoose.model('Group', GroupSchema);

//Export function to create "Group" model class
module.exports = Group;