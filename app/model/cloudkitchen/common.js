const PartyBundleCandidate = {
    name: String,
    required: Boolean,
    max: Number,
    items: [{
        type: String,
        ref: 'Menu'
    }]
}

module.exports = { PartyBundleCandidate }