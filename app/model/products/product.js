//Require Mongoose
var mongoose = require('mongoose');

//Mongoose Paginate V2
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
const { Variant, ProductInfo, SupplierBasic } = require('../common/modals');

// Define a Schema for our Product collection
const ProductSchema = new mongoose.Schema({
    name: String, // Product name
    group: { type: String, trim: true },
    supplier: SupplierBasic,
    productInfo: [ProductInfo],
    shortDesc: String,
    slug: String,
    weight: String,
    size: Variant,
    color: Variant,
    image: String,
    origin: String,
    description: [String],
    gallery: [String],
    colors: [Variant],
    sizes: [Variant],
    variants: [Variant],
    price: Number,
    priceOld: Number,
    availableDate: Date,
    dateAdded: Date,
    active: Boolean,
    dispatchFrom: String,
    freeDelivery: Boolean,
    collectionOnly: Boolean,
    discontinued: Boolean,
    stock: Boolean,
    deliveryLeadTime: Number,
    featured: Boolean,
    organic: Boolean,
    nationwide: Boolean,
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