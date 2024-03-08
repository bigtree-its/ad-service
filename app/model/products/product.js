//Require Mongoose
var mongoose = require('mongoose');
const uuid = require('node-uuid');
//Mongoose Paginate V2
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
const { Color, Varient, Extra, NameValue, Size } = require('../common/modals');

// Define a Schema for our Product collection
const ProductSchema= new mongoose.Schema({
    name: String, // Product name
    group: { type: String, default: uuid.v4 },
    supplier: { type: String, default: uuid.v4 },
    description: [String],
    details: [String],
    attributes: [NameValue],
    slug: String,
    size: Size,
    color: Extra,
    material: String,
    careInstruction: String,
    storageInstruction: String,
    image: String,
    shippingAndReturns: String,
    gallery: [String],
    colors: [Color],
    extras: [Extra],
    sizes: [Size],
    varients: [Varient],
    price: Number,
    priceOld: Number,
    dateAdded: Date,
    active: Boolean,
    collectionOnly: Boolean,
    discontinued: Boolean,
    featured: Boolean,
    preOrder: Boolean,
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