const Address = {
    line1: String,
    line2: String,
    city: String,
    postcode: String,
    country: String,
    latitude: String,
    longitude: String,
}
const Contact = {
    person: String,
    email: String,
    mobile: String,
    telephone: String
}

const NameValue = {
    name: String,
    value: String,
}

const ProductInfo = {
    title: String,
    details: [String],
    moreInfo: [NameValue]
}

const Customer = {
    _id: String,
    name: String,
    email: String,
    mobile: String,
    telephone: String
}

const SupplierBasic = {
    _id: String,
    name: String,
    tradingName: String,
    email: String,
    mobile: String,
    telephone: String
}

const Extra = {
    name: String,
    price: Number,
}
const Variant = {
    name: String,
    price: Number,
    detail: String,
}

const ServiceDistrict = {
    postcode: String,
    area: String,
    region: String,
}

module.exports = { ServiceDistrict, Customer, Address, Contact, NameValue, Extra, Variant, ProductInfo, SupplierBasic }