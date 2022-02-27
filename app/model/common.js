const Address = {
    name: String,
    email: String,
    mobile: String,
    telephone: String,
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
    person: String,
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

const ReturnPolicy = {

}

module.exports = { SuperStore, School, Address, Sale, Rental, Contact, Attribute, ReturnPolicy, NameValue }