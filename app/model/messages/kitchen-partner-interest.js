//Require Mongoose
var mongoose = require('mongoose');
const { Customer } = require('../common/modals');
// Define a Schema for our KitchenPartnerInterest collection
const KitchenPartnerInterestSchema = new mongoose.Schema({
    kitchenName: { type: String, trim: true },
    hygieneCertificateNumber: { type: String, trim: true },
    hygieneDate: Date,
    contactName: { type: String, trim: true },
    contactEmail: { type: String, trim: true },
    contactMobile: { type: String, trim: true },
    accountName: { type: String, trim: true },
    bankName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    sortCode: { type: String, trim: true },
    date: Date,
}, {
    timestamps: true
});
// Compile model from schema
// When you call mongoose.model() on a schema, Mongoose compiles a model for you.
// The first argument is the singular name of the collection your model is for. 
// ** Mongoose automatically looks for the plural, lower cased version of your model name.
// ** Thus, for the example above, the model Tank is for the tanks collection in the database.
var KitchenPartnerInterest = mongoose.model('KitchenPartnerInterest', KitchenPartnerInterestSchema);

//Export function to create "KitchenPartnerInterest" model class
module.exports = KitchenPartnerInterest;