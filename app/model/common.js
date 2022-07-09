const Address = {
    propertyNumber: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    postcode: String,
    country: String,
    latitude: Number,
    longitude: Number,
}
const SuperStore = {
    name: String, 
    distance: String,
    address: Address,
    isPrimary: Boolean,
    isSecondary: Boolean,
    isStateSchool: Boolean
}
const School = {
    name: String, 
    distance: String,
    address: Address,
    isPrimary: Boolean,
    isSecondary: Boolean,
    isStateSchool: Boolean
}

const Sale = {
    price: Number,
    quote: String
}

const Rental = {
    price: Number,
    quote: String,
    maxTerm: String,
    minTerm: String,
}

const Contact = {
    fullName: String,
    email: String,
    mobile: String,
    telephone: String
}

const FoodSlot  = {
     
}
const Attribute = {
    name: String,
    value: [String],
}

const NameValue = {
    name: String,
    value: String,
}
const Extra = {
    name: String,
    price: Number,
}

const ReturnPolicy = {

}

module.exports = { Extra, SuperStore, School, Address, Sale, Rental, Contact, Attribute, ReturnPolicy, NameValue }