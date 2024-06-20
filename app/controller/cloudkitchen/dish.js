const Dish = require('../../model/cloudkitchen/dish');
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');

// Require Validation Utils
const { validationResult, errorFormatter } = require('../validation');

// Create and Save a new Dish
exports.create = (req, res) => {
    console.log("Creating new dish " + JSON.stringify(req.body));
    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    console.log(`Finding if a dish already exist with name ${req.body.name}`);
    Dish.exists({ name: req.body.name }, function(err, result) {
        if (err) {
            return res.status(500).send({ message: `Error while finding Dish with name ${req.body.name}` });
        } else if (result) {
            console.log(`Dish already exist with name ${req.body.name}`);
            res.status(400).send({ message: `Dish already exist with name ${req.body.name}` });
        } else {
            persist(req, res);
        }
    });

};


// Retrieve and return all Dishs from the database.
exports.findAll = (req, res) => {
    console.log("Received request to get all dishs");
    Dish.find()
        .then(data => {
            if (data) {
                console.log("Returning " + data.length + " dishs.");
                res.send(data);
            } else {
                console.log("Returning no dishs ");
                res.send({});
            }
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving dishs."
            });
        });
};

// Deletes all
exports.deleteEverything = (req, res) => {
    Dish.remove().then(result => {
        res.send({ message: "Deleted all dishs" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all dishs. ${err.message}`
        });
    });
};

// Find a single Dish with a DishId
exports.findOne = (req, res) => {
    console.log("Received request get a dish with id " + req.params.id);
    Dish.findOne({ _id: req.params.id })
        .then(dish => {
            if (!dish) {
                return dishNotFoundWithId(req, res);
            }
            res.send(dish);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return dishNotFoundWithId(req, res);
            }
            return res.status(500).send({ message: "Error while retrieving Dish with id " + req.params.id });
        });
};

// Update a Dish identified by the DishId in the request
exports.update = (req, res) => {
    console.log("Updating dish " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "Dish body can not be empty" });
    }
    // Find Dish and update it with the request body
    Dish.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        .then(dish => {
            if (!dish) {
                return dishNotFoundWithId(req, res);
            }
            res.send(dish);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return dishNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Error updating Dish with id " + req.params.id
            });
        });
};

// Delete a Dish with the specified DishId in the request
exports.delete = (req, res) => {
    Dish.findByIdAndRemove(req.params.id)
        .then(dish => {
            if (!dish) {
                return dishNotFoundWithId(req, res);
            }
            res.send({ message: "Dish deleted successfully!" });
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                return dishNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Could not delete Dish with id " + req.params.id
            });
        });
};

/**
 * Persists new Dish document
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function persist(req, res) {
    const dish = buildDishObject(req);
    // Save Dish in the database
    dish.save()
        .then(data => {
            res.status(201).send(data);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Dish."
            });
        });
}

/**
 * Sends 404 HTTP Response with Message
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function dishNotFoundWithId(req, res) {
    res.status(404).send({ message: `Dish not found with id ${req.params.id}` });
}

/**
 * Builds Dish object from Request
 * 
 * @param {Request} req 
 */
function buildDishObject(req) {
    return new Dish(buildDishJson(req));
}

/**
 * Builds Dish Json from Request
 * 
 * @param {Request} req 
 */
function buildDishJson(req) {
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