//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require("underscore");

// Require Validation Utils
const { validationResult, errorFormatter } = require("./validation");
const Collection = require("../model/chef/collection");

// Create and Save a new Collection

// Create and Save a new Collection
exports.create = (req, res) => {
    console.log("Request to create new Collection " + JSON.stringify(req.body));
    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    var slug = getSlug(req.body.name);
    Collection.exists({ slug: slug, chefId: req.body.chefId },
        function (err, result) {
            if (err) {
                return res
                    .status(500)
                    .send({ message: `Error while finding Collection for: ${slug}` });
            } else if (result) {
                console.log(`Collection already exist for: ${slug}`);
                res
                    .status(400)
                    .send({ message: `Collection already exist for: ${slug}` });
            } else {
                persist(req, res);
            }
        }
    );
};

// Retrieve and return all Collections from the database.
// Retrieve and return all Collections from the database.
exports.findAll = (req, res) => {
    console.log("Received request to get all Collections");
    Collection.find()
        .then((data) => {
            if (data) {
                console.log("Returning " + data.length + " Collections.");
                res.send(data);
            } else {
                console.log("Returning no Collections ");
                res.send({});
            }
        })
        .catch((err) => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving Collections.",
            });
        });
};

// Retrieve and return all Collections from the database.
exports.lookup = (req, res) => {
    let query = Collection.find();
    if (req.query.chef) {
        // query.where('name', { $regex: '.*' + req.query.name + '.*' })
        query.where({
            chefId: { $regex: ".*" + req.query.chef + ".*", $options: "i" },
        });
    }
    Collection.find(query)
        .then((result) => {
            console.log(`Returning ${result.length} Collections.`);
            res.send(result);
        })
        .catch((error) => {
            console.log("Error while fetching from database. " + error.message);
            res.status(500).send({
                message: error.message || "Some error occurred while retrieving Collections.",
            });
        });
};

// Deletes all
exports.deleteEverything = (req, res) => {
    Collection.remove()
        .then((result) => {
            res.send({ message: "Deleted all Collections" });
        })
        .catch((err) => {
            return res.status(500).send({
                message: `Could not delete all Collections. ${err.message}`,
            });
        });
};

// Find a single Collection with a CollectionId
exports.findOne = (req, res) => {
    console.log("Received request get a Collection with id " + req.params.id);
    Collection.findOne({ _id: req.params.id })
        .then((Collection) => {
            if (!Collection) {
                return CollectionNotFoundWithId(req, res);
            }
            res.send(Collection);
        })
        .catch((err) => {
            if (err.kind === "ObjectId") {
                return CollectionNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Error while retrieving Collection with id " + req.params.id,
            });
        });
};

// Update a Collection identified by the CollectionId in the request
exports.update = (req, res) => {
    console.log("Updating Collection " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res
            .status(400)
            .send({ message: "Collection body can not be empty" });
    }
    // Find Collection and update it with the request body
    Collection.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        .then((Collection) => {
            if (!Collection) {
                return CollectionNotFoundWithId(req, res);
            }
            res.send(Collection);
        })
        .catch((err) => {
            if (err.kind === "ObjectId") {
                return CollectionNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Error updating Collection with id " + req.params.id,
            });
        });
};

// Delete a Collection with the specified CollectionId in the request
exports.delete = (req, res) => {

    if (req.query.chef) {
        deleteManyByQuery(req);
    } else {
        deleteOneById(req, res);
    }

};

function deleteManyByQuery(req) {
    let query = Collection.find();
    query.where({
        chefId: { $regex: ".*" + req.query.chef + ".*", $options: "i" },
    });
    Collection.deleteMany(query)
        .then(function () {
            // Success
            console.log("Collections for chef deleted");
        })
        .catch(function (error) {
            // Failure
            console.log(error);
        });
}

function deleteOneById(req, res) {
    Collection.findByIdAndRemove(req.params.id)
        .then((Collection) => {
            if (!Collection) {
                return CollectionNotFoundWithId(req, res);
            }
            res.send({ message: "Collection deleted successfully!" });
        })
        .catch((err) => {
            if (err.kind === "ObjectId" || err.name === "NotFound") {
                return CollectionNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Could not delete Collection with id " + req.params.id,
            });
        });
}

/**
 * Persists new Collection document
 *
 * @param {Request} req
 * @param {Response} res
 */
function persist(req, res) {
    const Collection = buildCollectionObject(req);
    // Save Collection in the database
    Collection
        .save()
        .then((data) => {
            console.log("New Collection created: " + data.name);
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
function CollectionNotFoundWithId(req, res) {
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
                .toLowerCase(),
    };
}

/**
 * Returns the slug from the given name
 * e.g if name = M & S Collections then Slug = m-s-Collections
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