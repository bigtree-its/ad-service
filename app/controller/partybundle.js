//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require("underscore");

// Require Validation Utils
const { validationResult, errorFormatter } = require("./validation");
const PartyBundle = require("../model/chef/partybundle");

// Create and Save a new PartyBundle
exports.create = (req, res) => {
    console.log("Request to create new PartyBundle " + JSON.stringify(req.body));
    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    var slug = getSlug(req.body.name);
    PartyBundle.exists({ slug: slug, chefId: req.body.chefId },
        function (err, result) {
            if (err) {
                return res
                    .status(500)
                    .send({ message: `Error while finding PartyBundle for: ${slug}` });
            } else if (result) {
                console.log(`PartyBundle already exist for: ${slug}`);
                res
                    .status(400)
                    .send({ message: `PartyBundle already exist for: ${slug}` });
            } else {
                persist(req, res);
            }
        }
    );
};

// Retrieve and return all PartyBundles from the database.
exports.findAll = (req, res) => {
    console.log("Received request to get all PartyBundles");
    PartyBundle.find()
        .populate({
            path: 'partyBundleCandidates',
            populate: {
                path: 'items',
                model: 'Menu'
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
    if (req.query.chef) {
        query.where("chefId", req.query.chef);
    }
    PartyBundle.find(query)
        .populate({
            path: 'partyBundleCandidates',
            populate: {
                path: 'items',
                model: 'Menu'
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
                model: 'Menu'
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
    if (req.query.chef) {
        deleteManyByQuery(req);
    } else {
        deleteOneById(req, res);
    }
};

function deleteManyByQuery(req) {
    let query = PartyBundle.find();
    query.where({
        chefId: { $regex: ".*" + req.query.chef + ".*", $options: "i" },
    });
    PartyBundle.deleteMany(query)
        .then(function () {
            // Success
            console.log("PartyBundles for chef deleted");
        })
        .catch(function (error) {
            // Failure
            console.log(error);
        });
}

function deleteOneById(req, res) {
    PartyBundle.findByIdAndRemove(req.params.id)
        .then((PartyBundle) => {
            if (!PartyBundle) {
                return PartyBundleNotFoundWithId(req, res);
            }
            res.send({ message: "PartyBundle deleted successfully!" });
        })
        .catch((err) => {
            if (err.kind === "ObjectId" || err.name === "NotFound") {
                return PartyBundleNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Could not delete PartyBundle with id " + req.params.id,
            });
        });
}

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
            console.log("New PartyBundle created: " + data.name);
            res.status(201).send(data);
        })
        .catch((err) => {
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
        chefId: req.body.chefId,
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