const Cuisine = require('../model/chef/cuisine');
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');

// Require Validation Utils
const { validationResult, errorFormatter } = require('./validation');

// Create and Save a new Cuisine
exports.create = (req, res) => {
    console.log("Creating new cuisine " + JSON.stringify(req.body));
    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    console.log(`Finding if a cuisine already exist with name ${req.body.name}`);
    Cuisine.exists({ name: req.body.name }, function(err, result) {
        if (err) {
            return res.status(500).send({ message: `Error while finding Cuisine with name ${req.body.name}` });
        } else if (result) {
            console.log(`Cuisine already exist with name ${req.body.name}`);
            res.status(400).send({ message: `Cuisine already exist with name ${req.body.name}` });
        } else {
            persist(req, res);
        }
    });

};


// Retrieve and return all Cuisines from the database.
exports.findAll = (req, res) => {
    console.log("Received request to get all cuisines");
    let query = Cuisine.find();
    if (req.query.slug) {
        query.where('slug', req.query.slug)
    }
    Cuisine.find(query)
        .then(data => {
            if (data) {
                console.log("Returning " + data.length + " cuisines.");
                res.send(data);
            } else {
                console.log("Returning no cuisines ");
                res.send({});
            }
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving cuisines."
            });
        });
};

// Deletes all
exports.deleteEverything = (req, res) => {
    Cuisine.remove().then(result => {
        res.send({ message: "Deleted all cuisines" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all cuisines. ${err.message}`
        });
    });
};

// Find a single Cuisine with a CuisineId
exports.findOne = (req, res) => {
    console.log("Received request get a cuisine with id " + req.params.id);
    Cuisine.findOne({ _id: req.params.id })
        .then(cuisine => {
            if (!cuisine) {
                return cuisineNotFoundWithId(req, res);
            }
            res.send(cuisine);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return cuisineNotFoundWithId(req, res);
            }
            return res.status(500).send({ message: "Error while retrieving Cuisine with id " + req.params.id });
        });
};

// Update a Cuisine identified by the CuisineId in the request
exports.update = (req, res) => {
    console.log("Updating cuisine " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "Cuisine body can not be empty" });
    }
    // Find Cuisine and update it with the request body
    Cuisine.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        .then(cuisine => {
            if (!cuisine) {
                return cuisineNotFoundWithId(req, res);
            }
            res.send(cuisine);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return cuisineNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Error updating Cuisine with id " + req.params.id
            });
        });
};

// Delete a Cuisine with the specified CuisineId in the request
exports.delete = (req, res) => {
    Cuisine.findByIdAndRemove(req.params.id)
        .then(cuisine => {
            if (!cuisine) {
                return cuisineNotFoundWithId(req, res);
            }
            res.send({ message: "Cuisine deleted successfully!" });
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                return cuisineNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Could not delete Cuisine with id " + req.params.id
            });
        });
};

/**
 * Persists new Cuisine document
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function persist(req, res) {
    const cuisine = buildCuisineObject(req);
    // Save Cuisine in the database
    cuisine.save()
        .then(data => {
            res.status(201).send(data);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Cuisine."
            });
        });
}

/**
 * Sends 404 HTTP Response with Message
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function cuisineNotFoundWithId(req, res) {
    res.status(404).send({ message: `Cuisine not found with id ${req.params.id}` });
}

/**
 * Builds Cuisine object from Request
 * 
 * @param {Request} req 
 */
function buildCuisineObject(req) {
    return new Cuisine(buildCuisineJson(req));
}

/**
 * Builds Cuisine Json from Request
 * 
 * @param {Request} req 
 */
function buildCuisineJson(req) {
    return {
        name: req.body.name,
        image: req.body.image,
        slug: req.body.slug || req.body.name.trim().replace(/[\W_]+/g, "-").toLowerCase(),
        logo: req.body.logo
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
    return name.trim().replace(/[\W_]+/g, "-").toLowerCase()
}