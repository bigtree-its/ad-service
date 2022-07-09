const Food = require('../model/localchef/food');
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');

// Require Validation Utils
const { validationResult, errorFormatter } = require('./validation');

// Create and Save a new Food
exports.create = (req, res) => {
    console.log("Creating new food " + JSON.stringify(req.body));
    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    var slug = getSlug(req.body.name, req.body.chefId);
    console.log(`Finding if a food already exist for: ${slug}`);
   
    Food.exists({ slug: slug }, function(err, result) {
        if (err) {
            return res.status(500).send({ message: `Error while finding Food for: ${slug}` });
        } else if (result) {
            console.log(`Food already exist for: ${slug}`);
            res.status(400).send({ message: `Food already exist for: ${slug}` });
        } else {
            persist(req, res);
        }
    });

};

// Retrieve and return all local area from the database.
exports.lookup = (req, res) => {
    let query = Food.find();
    if (req.query.chef) {
        // query.where('name', { $regex: '.*' + req.query.name + '.*' })
        query.where({ chefId: { '$regex': '.*' + req.query.chef + '.*', '$options': 'i' } })
    }
    Food.find(query).then(result => {
        console.log(`Returning ${result.length} local area.`);
        res.send(result);
    }).catch(error => {
        console.log("Error while fetching from database. " + error.message);
        res.status(500).send({
            message: error.message || "Some error occurred while retrieving local area."
        });
    });
};

// Retrieve and return all Foods from the database.
exports.findAll = (req, res) => {
    console.log("Received request to get all foods");
    if (req.query.chef) {
        return this.lookup(req, res);
    }else{
        Food.find()
        .then(data => {
            if (data) {
                console.log("Returning " + data.length + " foods.");
                res.send(data);
            } else {
                console.log("Returning no foods ");
                res.send({});
            }
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving foods."
            });
        });
    }
   
};

// Deletes all
exports.deleteEverything = (req, res) => {
    Food.remove().then(result => {
        res.send({ message: "Deleted all foods" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all foods. ${err.message}`
        });
    });
};

// Find a single Food with a FoodId
exports.findOne = (req, res) => {
    console.log("Received request get a food with id " + req.params.id);
    Food.findOne({ _id: req.params.id })
        .then(food => {
            if (!food) {
                return foodNotFoundWithId(req, res);
            }
            res.send(food);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return foodNotFoundWithId(req, res);
            }
            return res.status(500).send({ message: "Error while retrieving Food with id " + req.params.id });
        });
};

// Update a Food identified by the FoodId in the request
exports.update = (req, res) => {
    console.log("Updating food " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "Food body can not be empty" });
    }
    // Find Food and update it with the request body
    Food.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        .then(food => {
            if (!food) {
                return foodNotFoundWithId(req, res);
            }
            res.send(food);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return foodNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Error updating Food with id " + req.params.id
            });
        });
};

// Delete a Food with the specified FoodId in the request
exports.delete = (req, res) => {
    Food.findByIdAndRemove(req.params.id)
        .then(food => {
            if (!food) {
                return foodNotFoundWithId(req, res);
            }
            res.send({ message: "Food deleted successfully!" });
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                return foodNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Could not delete Food with id " + req.params.id
            });
        });
};

/**
 * Persists new Food document
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function persist(req, res) {
    const food = buildFoodObject(req);
    // Save Food in the database
    food.save()
        .then(data => {
            res.status(201).send(data);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Food."
            });
        });
}

/**
 * Sends 404 HTTP Response with Message
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function foodNotFoundWithId(req, res) {
    res.status(404).send({ message: `Food not found with id ${req.params.id}` });
}

/**
 * Builds Food object from Request
 * 
 * @param {Request} req 
 */
function buildFoodObject(req) {
    return new Food(buildFoodJson(req));
}

/**
 * Builds Food Json from Request
 * 
 * @param {Request} req 
 */
function buildFoodJson(req) {
    return {
        name: req.body.name,
        chefId: req.body.chefId,
        category: req.body.category,
        image: req.body.image,
        spice: req.body.spice,
        vegetarian: req.body.vegetarian,
        extras: req.body.extras,
        choices: req.body.choices,
        description: req.body.description,
        price: req.body.price,
        ourPrice: req.body.price + (10/100 * req.body.price),
        discountedPrice: req.body.discountedPrice,
        discounted: req.body.discounted,
        slug: req.body.slug || getSlug(req.body.name, req.body.chefId)
    };
}

/**
 * Returns the slug from the given name
 * e.g if name = M & S Foods then Slug = m-s-foods
 * Replaces special characters and replace space with -
 * 
 * @param {String} name 
 */
function getSlug(name, chefId) {
    return name.trim().replace(/[\W_]+/g, "-").toLowerCase() +"-"+ chefId.trim().replace(/[\W_]+/g, "-").toLowerCase()
}