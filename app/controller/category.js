const Category = require("../model/chef/category");
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require("underscore");

// Require Validation Utils
const { validationResult, errorFormatter } = require("./validation");

// Create and Save a new Category
exports.create = (req, res) => {
    console.log("Creating new category " + JSON.stringify(req.body));
    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    console.log(`Finding if a category already exist with name ${req.body.name}`);
    Category.exists({ name: req.body.name }, function(err, result) {
        if (err) {
            return res
                .status(500)
                .send({
                    message: `Error while finding Category with name ${req.body.name}`,
                });
        } else if (result) {
            console.log(`Category already exist with name ${req.body.name}`);
            res
                .status(400)
                .send({ message: `Category already exist with name ${eq.body.name}` });
        } else {
            persist(req, res);
        }
    });
};

// Retrieve and return all categories from the database.
exports.findAll = (req, res) => {
    console.log("Received request to get all categories");
    Category.find()
        .then((data) => {
            if (data) {
                console.log("Returning " + data.length + " categories.");
                res.send(data);
            } else {
                console.log("Returning no categories ");
                res.send({});
            }
        })
        .catch((err) => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving categories.",
            });
        });
};

// Deletes all
exports.deleteEverything = (req, res) => {
    Category.remove()
        .then((result) => {
            res.send({ message: "Deleted all categories" });
        })
        .catch((err) => {
            return res.status(500).send({
                message: `Could not delete all categories. ${err.message}`,
            });
        });
};

// Find a single Category with a CategoryId
exports.findOne = (req, res) => {
    console.log("Received request get a category with id " + req.params.id);
    Category.findOne({ _id: req.params.id })
        .then((category) => {
            if (!category) {
                return categoryNotFoundWithId(req, res);
            }
            res.send(category);
        })
        .catch((err) => {
            if (err.kind === "ObjectId") {
                return categoryNotFoundWithId(req, res);
            }
            return res
                .status(500)
                .send({
                    message: "Error while retrieving Category with id " + req.params.id,
                });
        });
};

// Update a Category identified by the CategoryId in the request
exports.update = (req, res) => {
    console.log("Updating category " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "Category body can not be empty" });
    }
    // Find Category and update it with the request body
    Category.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        .then((category) => {
            if (!category) {
                return categoryNotFoundWithId(req, res);
            }
            res.send(category);
        })
        .catch((err) => {
            if (err.kind === "ObjectId") {
                return categoryNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Error updating Category with id " + req.params.id,
            });
        });
};

// Delete a Category with the specified CategoryId in the request
exports.delete = (req, res) => {
    Category.findByIdAndRemove(req.params.id)
        .then((category) => {
            if (!category) {
                return categoryNotFoundWithId(req, res);
            }
            res.send({ message: "Category deleted successfully!" });
        })
        .catch((err) => {
            if (err.kind === "ObjectId" || err.name === "NotFound") {
                return categoryNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Could not delete Category with id " + req.params.id,
            });
        });
};

/**
 * Persists new Category document
 *
 * @param {Request} req
 * @param {Response} res
 */
function persist(req, res) {
    const category = buildCategoryObject(req);
    // Save Category in the database
    category
        .save()
        .then((data) => {
            res.status(201).send(data);
        })
        .catch((err) => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Category.",
            });
        });
}

/**
 * Sends 404 HTTP Response with Message
 *
 * @param {Request} req
 * @param {Response} res
 */
function categoryNotFoundWithId(req, res) {
    res
        .status(404)
        .send({ message: `Category not found with id ${req.params.id}` });
}

/**
 * Builds Category object from Request
 *
 * @param {Request} req
 */
function buildCategoryObject(req) {
    return new Category(buildCategoryJson(req));
}

/**
 * Builds Category Json from Request
 *
 * @param {Request} req
 */
function buildCategoryJson(req) {
    return {
        name: req.body.name,
        slug: req.body.slug ||
            req.body.name
            .trim()
            .replace(/[\W_]+/g, "-")
            .toLowerCase()
    };
}

/**
 * Returns the slug from the given name
 * e.g if name = M & S Foods then Slug = m-s-foods
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