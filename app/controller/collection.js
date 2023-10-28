const Collection = require("../model/chef/collection");
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require("underscore");

// Require Validation Utils
const { validationResult, errorFormatter } = require("./validation");

// Create and Save a new Collection

// Create and Save a new Collection
exports.create = (req, res) => {
    console.log("Request to create new collection " + JSON.stringify(req.body));
    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    var slug = getSlug(req.body.name);
    Collection.exists({ slug: slug, chefId: req.body.chefId }, function(err, result) {
        if (err) {
            return res.status(500).send({ message: `Error while finding Collection for: ${slug}` });
        } else if (result) {
            console.log(`Collection already exist for: ${slug}`);
            res.status(400).send({ message: `Collection already exist for: ${slug}` });
        } else {
            persist(req, res);
        }
    });

};

// Retrieve and return all collections from the database.
// Retrieve and return all Collections from the database.
exports.findAll = (req, res) => {
    console.log("Received request to get all collections");
    if (req.query.chef) {
        return this.lookup(req, res);
    } else {
        Collection.find()
            .then(data => {
                if (data) {
                    console.log("Returning " + data.length + " collections.");
                    res.send(data);
                } else {
                    console.log("Returning no collections ");
                    res.send({});
                }
            })
            .catch(err => {
                res.status(500).send({
                    message: err.message || "Some error occurred while retrieving collections."
                });
            });
    }

};

// Retrieve and return all collections from the database.
exports.lookup = (req, res) => {
    let query = Collection.find();
    if (req.query.chef) {
        // query.where('name', { $regex: '.*' + req.query.name + '.*' })
        query.where({ chefId: { '$regex': '.*' + req.query.chef + '.*', '$options': 'i' } })
    }
    Collection.find(query).then(result => {
        console.log(`Returning ${result.length} collections.`);
        res.send(result);
    }).catch(error => {
        console.log("Error while fetching from database. " + error.message);
        res.status(500).send({
            message: error.message || "Some error occurred while retrieving collections."
        });
    });
};

// Deletes all
exports.deleteEverything = (req, res) => {
    Collection.remove()
        .then((result) => {
            res.send({ message: "Deleted all collections" });
        })
        .catch((err) => {
            return res.status(500).send({
                message: `Could not delete all collections. ${err.message}`,
            });
        });
};

// Find a single Collection with a CollectionId
exports.findOne = (req, res) => {
    console.log("Received request get a collection with id " + req.params.id);
    Collection.findOne({ _id: req.params.id })
        .then((collection) => {
            if (!collection) {
                return collectionNotFoundWithId(req, res);
            }
            res.send(collection);
        })
        .catch((err) => {
            if (err.kind === "ObjectId") {
                return collectionNotFoundWithId(req, res);
            }
            return res
                .status(500)
                .send({
                    message: "Error while retrieving Collection with id " + req.params.id,
                });
        });
};

// Update a Collection identified by the CollectionId in the request
exports.update = (req, res) => {
    console.log("Updating collection " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "Collection body can not be empty" });
    }
    // Find Collection and update it with the request body
    Collection.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        .then((collection) => {
            if (!collection) {
                return collectionNotFoundWithId(req, res);
            }
            res.send(collection);
        })
        .catch((err) => {
            if (err.kind === "ObjectId") {
                return collectionNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Error updating Collection with id " + req.params.id,
            });
        });
};

// Delete a Collection with the specified CollectionId in the request
exports.delete = (req, res) => {
    Collection.findByIdAndRemove(req.params.id)
        .then((collection) => {
            if (!collection) {
                return collectionNotFoundWithId(req, res);
            }
            res.send({ message: "Collection deleted successfully!" });
        })
        .catch((err) => {
            if (err.kind === "ObjectId" || err.name === "NotFound") {
                return collectionNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Could not delete Collection with id " + req.params.id,
            });
        });
};

/**
 * Persists new Collection document
 *
 * @param {Request} req
 * @param {Response} res
 */
function persist(req, res) {
    const collection = buildCollectionObject(req);
    // Save Collection in the database
    collection
        .save()
        .then((data) => {
            console.log('New collection created: '+ data.name)
            res.status(201).send(data);
        })
        .catch((err) => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Collection.",
            });
        });
}

/**
 * Sends 404 HTTP Response with Message
 *
 * @param {Request} req
 * @param {Response} res
 */
function collectionNotFoundWithId(req, res) {
    res
        .status(404)
        .send({ message: `Collection not found with id ${req.params.id}` });
}

/**
 * Builds Collection object from Request
 *
 * @param {Request} req
 */
function buildCollectionObject(req) {
    return new Collection(buildCollectionJson(req));
}

/**
 * Builds Collection Json from Request
 *
 * @param {Request} req
 */
function buildCollectionJson(req) {
    return {
        name: req.body.name,
        chefId: req.body.chefId,
        image: req.body.image,
        active: req.body.active,
        slug: req.body.slug ||
            req.body.name
            .trim()
            .replace(/[\W_]+/g, "-")
            .toLowerCase()
    };
}

/**
 * Returns the slug from the given name
 * e.g if name = M & S Collections then Slug = m-s-collections
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