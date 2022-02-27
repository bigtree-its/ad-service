//Require Mongoose
var mongoose = require('mongoose');

// Define a Schema for our Cook collection
const CookSchema = new mongoose.Schema({
    business_name: { type: String, trim: true },
    business_id: { type: String, trim: true },
    slug: { type: String, trim: true },
    logo: String,
    cuisines: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cuisine'
    }],
    slot: [String], // [Lunch, breakfast, Dinner, LateNight, Easr]
    person: String,
    email: String,
    phone: String,
    street: String,
    door_number: String,
    city: String,
    postcode: String,
    country: String,
    state: String,
}, {
    timestamps: true
});
// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the collection your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model Tank is for the tanks collection in the database.
var Cook = mongoose.model('Cook', CookSchema);
//Ensure mongoose automatically created _id field for the document
Cook._id instanceof mongoose.Types.ObjectId;

//Export function to create "Cook" model class
module.exports = Cook;