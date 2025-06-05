const PartyBundleCandidate = {
    name: String,
    required: Boolean,
    max: Number,
    items: [{
        type: String,
        ref: 'Menu'
    }]
}


const Kitchen = {
    _id: String,
    name: String,
    tradingName: String,
    image: String,
    email: String,
    mobile: String,
    telephone: String
}

module.exports = { Kitchen, PartyBundleCandidate }