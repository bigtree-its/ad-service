//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require("underscore");

// Require Validation Utils
const { validationResult, errorFormatter } = require("../validation");
const Group = require("../../model/products/group");

// Create and Save a new Collection

// Create and Save a new Collection
exports.create = (req, res) => {
    console.log("Request to create new Group " + JSON.stringify(req.body));
    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    var slug = getSlug(req.body.name);
    Group.exists({ slug: slug },
        function(err, result) {
            if (err) {
                return res
                    .status(500)
                    .send({ message: `Error while finding Group for: ${slug}` });
            } else if (result) {
                console.log(`Group already exist for: ${slug}`);
                res
                    .status(400)
                    .send({ message: `Group already exist for: ${slug}` });
            } else {
                persist(req, res);
            }
        }
    );
};

// Retrieve and return all groups from the database.
// Retrieve and return all groups from the database.
exports.findAll = (req, res) => {
    console.log("Received request to get all groups");
    if (req.query.chef) {
        return this.lookup(req, res);
    } else {
        Group.find()
            .then((data) => {
                if (data) {
                    console.log("Returning " + data.length + " groups.");
                    res.send(data);
                } else {
                    console.log("Returning no groups ");
                    res.send({});
                }
            })
            .catch((err) => {
                res.status(500).send({
                    message: err.message || "Some error occurred while retrieving groups.",
                });
            });
    }
};

// Retrieve and return all groups from the database.
exports.lookup = (req, res) => {
    let query = Group.find();
    if (req.query.chef) {
        // query.where('name', { $regex: '.*' + req.query.name + '.*' })
        query.where({
            chefId: { $regex: ".*" + req.query.chef + ".*", $options: "i" },
        });
    }
    Group.find(query)
        .then((result) => {
            console.log(`Returning ${result.length} groups.`);
            res.send(result);
        })
        .catch((error) => {
            console.log("Error while fetching from database. " + error.message);
            res.status(500).send({
                message: error.message || "Some error occurred while retrieving groups.",
            });
        });
};

// Deletes all
exports.deleteEverything = (req, res) => {
    Group.remove()
        .then((result) => {
            res.send({ message: "Deleted all groups" });
        })
        .catch((err) => {
            return res.status(500).send({
                message: `Could not delete all groups. ${err.message}`,
            });
        });
};

// Find a single Group with a CollectionId
exports.findOne = (req, res) => {
    console.log("Received request get a Group with id " + req.params.id);
    Group.findOne({ _id: req.params.id })
        .then((collection) => {
            if (!collection) {
                return objectNotFoundWithId(req, res);
            }
            res.send(collection);
        })
        .catch((err) => {
            if (err.kind === "ObjectId") {
                return objectNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Error while retrieving Group with id " + req.params.id,
            });
        });
};

// Update a Group identified by the CollectionId in the request
exports.update = (req, res) => {
    console.log("Updating Group " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res
            .status(400)
            .send({ message: "Group body can not be empty" });
    }
    // Find Group and update it with the request body
    Group.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        .then((collection) => {
            if (!collection) {
                return objectNotFoundWithId(req, res);
            }
            res.send(collection);
        })
        .catch((err) => {
            if (err.kind === "ObjectId") {
                return objectNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Error updating Group with id " + req.params.id,
            });
        });
};

// Delete a Group with the specified CollectionId in the request
exports.delete = (req, res) => {

    if (req.query.name) {
        deleteManyByQuery(req);
    } else {
        deleteOneById(req, res);
    }

};

function deleteManyByQuery(req) {
    let query = Group.find();
    query.where({
        chefId: { $regex: ".*" + req.query.name + ".*", $options: "i" },
    });
    Group.deleteMany(query)
        .then(function() {
            // Success
            console.log("Groups deleted");
        })
        .catch(function(error) {
            // Failure
            console.log(error);
        });
}

function deleteOneById(req, res) {
    Group.findByIdAndRemove(req.params.id)
        .then((collection) => {
            if (!collection) {
                return objectNotFoundWithId(req, res);
            }
            res.send({ message: "Group deleted successfully!" });
        })
        .catch((err) => {
            if (err.kind === "ObjectId" || err.name === "NotFound") {
                return objectNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Could not delete Group with id " + req.params.id,
            });
        });
}

/**
 * Persists new Group document
 *
 * @param {Request} req
 * @param {Response} res
 */
function persist(req, res) {
    const persistable = buildPersistableObject(req);
    // Save Group in the database
    persistable
        .save()
        .then((data) => {
            console.log("New Group created: " + data.name);
            res.status(201).send(data);
        })
        .catch((err) => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Group.",
            });
        });
}

/**
 * Sends 404 HTTP Response with Message
 *
 * @param {Request} req
 * @param {Response} res
 */
function objectNotFoundWithId(req, res) {
    res
        .status(404)
        .send({ message: `Group not found with id ${req.params.id}` });
}

/**
 * Builds Group object from Request
 *
 * @param {Request} req
 */
function buildPersistableObject(req) {
    return new Group(buildFromJson(req));
}

/**
 * Builds Group Json from Request
 *
 * @param {Request} req
 */
function buildFromJson(req) {
    return {
        name: req.body.name,
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
 * e.g if name = M & S groups then Slug = m-s-groups
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