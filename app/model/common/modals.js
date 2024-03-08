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

const Customer = {
    _id: String,
    name: String,
    email: String,
    mobile: String,
    telephone: String
}

const NameValue = {
    name: String,
    value: String,
}
const Extra = {
    name: String,
    price: Number,
}
const Varient = {
    name: String,
    price: Number,
}

const Color = {
    name: String,
    price: Number,
}
const Size = {
    name: String,
    price: Number,
    details: [String],
}
module.exports = { Customer, Address, Contact, NameValue, Extra, Color, Size, Varient }