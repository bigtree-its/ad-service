//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require("underscore");

// Require Validation Utils
const { validationResult, errorFormatter } = require("./validation");
const Question  = require("../../model/products/Question ");

// Create and Save a new Collection

// Create and Save a new Collection
exports.create = (req, res) => {
    console.log("Request to create new Question  " + JSON.stringify(req.body));
    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    var slug = getSlug(req.body.name);
    Question .exists({ slug: slug },
        function(err, result) {
            if (err) {
                return res
                    .status(500)
                    .send({ message: `Error while finding Question  for: ${slug}` });
            } else if (result) {
                console.log(`Question  already exist for: ${slug}`);
                res
                    .status(400)
                    .send({ message: `Question  already exist for: ${slug}` });
            } else {
                persist(req, res);
            }
        }
    );
};

// Retrieve and return all Questions from the database.
// Retrieve and return all Questions from the database.
exports.findAll = (req, res) => {
    console.log("Received request to get all Questions");
    if (req.query.chef) {
        return this.lookup(req, res);
    } else {
        Question .find()
            .then((data) => {
                if (data) {
                    console.log("Returning " + data.length + " Questions.");
                    res.send(data);
                } else {
                    console.log("Returning no Questions ");
                    res.send({});
                }
            })
            .catch((err) => {
                res.status(500).send({
                    message: err.message || "Some error occurred while retrieving Questions.",
                });
            });
    }
};

// Retrieve and return all Questions from the database.
exports.lookup = (req, res) => {
    let query = Question .find();
    if (req.query.chef) {
        // query.where('name', { $regex: '.*' + req.query.name + '.*' })
        query.where({
            chefId: { $regex: ".*" + req.query.chef + ".*", $options: "i" },
        });
    }
    Question .find(query)
        .then((result) => {
            console.log(`Returning ${result.length} Questions.`);
            res.send(result);
        })
        .catch((error) => {
            console.log("Error while fetching from database. " + error.message);
            res.status(500).send({
                message: error.message || "Some error occurred while retrieving Questions.",
            });
        });
};

// Deletes all
exports.deleteEverything = (req, res) => {
    Question .remove()
        .then((result) => {
            res.send({ message: "Deleted all Questions" });
        })
        .catch((err) => {
            return res.status(500).send({
                message: `Could not delete all Questions. ${err.message}`,
            });
        });
};

// Find a single Question  with a CollectionId
exports.findOne = (req, res) => {
    console.log("Received request get a Question  with id " + req.params.id);
    Question .findOne({ _id: req.params.id })
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
                message: "Error while retrieving Question  with id " + req.params.id,
            });
        });
};

// Update a Question  identified by the CollectionId in the request
exports.update = (req, res) => {
    console.log("Updating Question  " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res
            .status(400)
            .send({ message: "Question  body can not be empty" });
    }
    // Find Question  and update it with the request body
    Question .findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
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
                message: "Error updating Question  with id " + req.params.id,
            });
        });
};

// Delete a Question  with the specified CollectionId in the request
exports.delete = (req, res) => {

    if (req.query.name) {
        deleteManyByQuery(req);
    } else {
        deleteOneById(req, res);
    }

};

function deleteManyByQuery(req) {
    let query = Question .find();
    query.where({
        chefId: { $regex: ".*" + req.query.name + ".*", $options: "i" },
    });
    Question .deleteMany(query)
        .then(function() {
            // Success
            console.log("Question s deleted");
        })
        .catch(function(error) {
            // Failure
            console.log(error);
        });
}

function deleteOneById(req, res) {
    Question .findByIdAndRemove(req.params.id)
        .then((collection) => {
            if (!collection) {
                return objectNotFoundWithId(req, res);
            }
            res.send({ message: "Question  deleted successfully!" });
        })
        .catch((err) => {
            if (err.kind === "ObjectId" || err.name === "NotFound") {
                return objectNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Could not delete Question  with id " + req.params.id,
            });
        });
}

/**
 * Persists new Question  document
 *
 * @param {Request} req
 * @param {Response} res
 */
function persist(req, res) {
    const persistable = buildPersistableObject(req);
    // Save Question  in the database
    persistable
        .save()
        .then((data) => {
            console.log("New Question  created: " + data.name);
            res.status(201).send(data);
        })
        .catch((err) => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Question .",
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
        .send({ message: `Question  not found with id ${req.params.id}` });
}

/**
 * Builds Question  object from Request
 *
 * @param {Request} req
 */
function buildPersistableObject(req) {
    return new Question (buildFromJson(req));
}

/**
 * Builds Question  Json from Request
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
 * e.g if name = M & S Questions then Slug = m-s-Questions
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