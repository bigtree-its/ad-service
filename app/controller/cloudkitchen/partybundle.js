//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require("underscore");

// Require Validation Utils
const { validationResult, errorFormatter } = require("../validation");
const PartyBundle = require("../../model/cloudkitchen/partybundle");

// Create and Save a new PartyBundle
exports.create = async (req, res) => {
    console.log("Request to create new PartyBundle " + JSON.stringify(req.body));
    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    var slug = getSlug(req.body.name);
    var _id = await PartyBundle.exists({ slug: slug, cloudKitchenId: req.body.cloudKitchenId });
    if (_id) {
        console.log(`PartyBundle already exist with name ${slug}`);
        res
            .status(400)
            .send({ message: `PartyBundle already exist with name ${slug}` });
    } else {
        persist(req, res);
    }
};

// Retrieve and return all PartyBundles from the database.
exports.findAll = (req, res) => {
    console.log("Received request to get all PartyBundles");
    PartyBundle.find()
        .populate({
            path: 'partyBundleCandidates',
            populate: {
                path: 'items',
                model: 'Food'
            }
        })
        .then((data) => {
            if (data) {
                console.log("Returning " + data.length + " PartyBundles.");
                res.send(data);
            } else {
                console.log("Returning no PartyBundles ");
                res.send({});
            }
        })
        .catch((err) => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving PartyBundles.",
            });
        });
};

// Retrieve and return all PartyBundles from the database.
exports.lookup = (req, res) => {
    let query = PartyBundle.find();
    if (req.query.cloudKitchenId) {
        query.where("cloudKitchenId", req.query.cloudKitchenId);
    }
    PartyBundle.find(query)
        .populate({
            path: 'partyBundleCandidates',
            populate: {
                path: 'items',
                model: 'Food'
            }
        })
        .then((result) => {
            console.log(`Returning ${result.length} PartyBundles.`);
            res.send(result);
        })
        .catch((error) => {
            console.log("Error while fetching from database. " + error.message);
            res.status(500).send({
                message: error.message || "Some error occurred while retrieving PartyBundles.",
            });
        });
};

// Deletes all
exports.deleteEverything = (req, res) => {
    PartyBundle.remove()
        .then((result) => {
            res.send({ message: "Deleted all PartyBundles" });
        })
        .catch((err) => {
            return res.status(500).send({
                message: `Could not delete all PartyBundles. ${err.message}`,
            });
        });
};

// Find a single PartyBundle with a PartyBundleId
exports.findOne = (req, res) => {
    console.log("Received request get a PartyBundle with id " + req.params.id);
    PartyBundle.findOne({ _id: req.params.id })
        .populate({
            path: 'partyBundleCandidates',
            populate: {
                path: 'items',
                model: 'Food'
            }
        })
        .then((PartyBundle) => {
            if (!PartyBundle) {
                return PartyBundleNotFoundWithId(req, res);
            }
            res.send(PartyBundle);
        })
        .catch((err) => {
            if (err.kind === "ObjectId") {
                return PartyBundleNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Error while retrieving PartyBundle with id " + req.params.id,
            });
        });
};

// Update a PartyBundle identified by the PartyBundleId in the request
exports.update = (req, res) => {
    console.log("Updating PartyBundle " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res
            .status(400)
            .send({ message: "PartyBundle body can not be empty" });
    }
    // Find PartyBundle and update it with the request body
    PartyBundle.findByIdAndUpdate(
            req.params.id, { $set: req.body }, { new: true }
        )
        .then((PartyBundle) => {
            if (!PartyBundle) {
                return PartyBundleNotFoundWithId(req, res);
            }
            res.send(PartyBundle);
        })
        .catch((err) => {
            if (err.kind === "ObjectId") {
                return PartyBundleNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Error updating PartyBundle with id " + req.params.id,
            });
        });
};

// Delete a PartyBundle with the specified PartyBundleId in the request
exports.delete = (req, res) => {
    if (req.query.cloudKitchenId) {
        deleteManyByQuery(req);
    } else {
        deleteOneById(req, res);
    }
};


// Deletes a Collection with the specified BrandId in the request
exports.deleteOne = async (req, res) => {
    console.log('Deleting a PartyBundle ' + req.params.id);
    PartyBundle.deleteOne({ _id: req.params.id })
        .then(data => {
            console.log('Deleted PartyBundle ' + JSON.stringify(data));
            res.send({ message: "PartyBundle deleted successfully!" });
        }).catch(err => {
            console.log('Error while deleting PartyBundle ' + JSON.stringify(err))
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                res.status(404).send({ message: `PartyBundle not found with id ${req.params.id}` });
            } else {
                res.status(500).send({ message: `Could not delete PartyBundle with id ${req.params.id}` });
            }
        });
};

// Deletes a Collection with the specified BrandId in the request
exports.deleteEverything = (req, res) => {
    let filter = PartyBundle.find();
    if (req.query.cloudKitchenId) {
        filter.where('cloudKitchenId', req.query.cloudKitchenId);
        PartyBundle.deleteMany(filter).then(result => {
            console.log('Deleted PartyBundles ' + JSON.stringify(result));
            res.send({ message: "PartyBundles deleted successfully!" });
        }).catch(err => {
            console.log('Error while deleting PartyBundles ' + JSON.stringify(err))
            return res.status(500).send({
                message: `Could not delete all PartyBundles. ${err.message}`
            });
        });
    } else {
        res.status(500).send({ message: `PartyBundle cloudKitchenId manadatory` });
    }
};


/**
 * Persists new PartyBundle document
 *
 * @param {Request} req
 * @param {Response} res
 */
function persist(req, res) {
    const PartyBundle = buildPartyBundleObject(req);
    // Save PartyBundle in the database
    PartyBundle.save()
        .then((data) => {
            console.log('Party Bundle created ' + JSON.stringify(data));
            res.status(201).send(data);
        })
        .catch((err) => {
            console.log('Party Bundle creation error ' + JSON.stringify(err));
            res.status(500).send({
                message: err.message || "Some error occurred while creating the PartyBundle.",
            });
        });
}


/**
 * Sends 404 HTTP Response with Message
 *
 * @param {Request} req
 * @param {Response} res
 */
function PartyBundleNotFoundWithId(req, res) {
    res
        .status(404)
        .send({ message: `PartyBundle not found with id ${req.params.id}` });
}

/**
 * Builds PartyBundle object from Request
 *
 * @param {Request} req
 */
function buildPartyBundleObject(req) {
    return new PartyBundle(buildPartyBundleJson(req));
}

/**
 * Builds PartyBundle Json from Request
 *
 * @param {Request} req
 */
function buildPartyBundleJson(req) {
    return {
        active: req.body.active ? req.body.active : false,
        name: req.body.name,
        cloudKitchenId: req.body.cloudKitchenId,
        collectionId: req.body.collectionId,
        vegetarian: req.body.vegetarian,
        partyBundleCandidates: req.body.partyBundleCandidates,
        description: req.body.description,
        price: req.body.price,
        discountedPrice: req.body.discountedPrice,
        discounted: req.body.discounted,
        slug: req.body.slug ||
            req.body.name
            .trim()
            .replace(/[\W_]+/g, "-")
            .toLowerCase(),
    };
}

/**
 * Returns the slug from the given name
 * e.g if name = M & S PartyBundles then Slug = m-s-PartyBundles
 * Replaces special characters and replace space with -
 *
 * @param {String} name
 */
function getSlug(name) {
    return name
        .trim()
        .replace(/[\W_]+/g, "-")
        .toLowerCase();
}