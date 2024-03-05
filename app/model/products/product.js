//Require Mongoose
var mongoose = require('mongoose');
//Mongoose Paginate V2
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');

// Define a Schema for our Product collection
const ProductSchema= new mongoose.Schema({
    title: String, // Product name
    type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductType'
    },
    supplierId: { type: String, default: uuid.v4 },
    description: [String],
    details: [String],
    attributes: [NameValue],
    coverPhoto: String,
    shippingAndReturns: String,
    gallery: [String],
    price: Number,
    priceOld: Number,
    date: Date,
    address: Address,
    contact: Contact,
    featured: Boolean,
}, {
    timestamps: true
});

ProductSchema.plugin(aggregatePaginate);

// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the collection your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model Tank is for the tanks collection in the database.
var Product = mongoose.model('Product', ProductSchema);
//Ensure mongoose automatically created _id field for the document
Product._id instanceof mongoose.Types.ObjectId;

//Export function to create "Product" model class
module.exports = Product;