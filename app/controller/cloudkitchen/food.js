const Food = require('../../model/cloudkitchen/food');
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');

// Require Validation Utils
const { validationResult, errorFormatter } = require('../validation');

// Create and Save a new Food
exports.create = async(req, res) => {
    console.log("Creating new food " + JSON.stringify(req.body));
    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    var slug = getSlug(req.body.name, req.body.cloudKitchenId);
    console.log(`Finding if a food already exist for: ${slug}`);
    var _id = await Food.exists({ slug: slug });
    if (_id) {
        console.log(`Menu already exist with name ${req.body.name}`);
        res
            .status(400)
            .send({ message: `Menu already exist with name ${req.body.name}` });
    } else {
        persist(req, res);
    }
};

// Retrieve and return all Food from the database.
exports.lookup = (req, res) => {
    console.log('Finding menus..')
    let query = Food.find();
    if (req.query.cloudKitchenId) {
        query.where('cloudKitchenId', req.query.cloudKitchenId);
    }
    if (req.query.collection) {
        query.where('collectionId', req.query.collection);
    }
    if (req.query.vegetarian) {
        query.where('vegetarian', req.query.vegetarian);
    }

    query.where({ active: true });
    Food.find(query).then(result => {
        console.log(`Returning ${result.length} Foods.`);
        res.send(result);
    }).catch(error => {
        console.log("Error while fetching Food from database. " + error.message);
        res.status(500).send({
            message: error.message || "Some error occurred while retrieving Food."
        });
    });
};


// Deletes all
exports.deleteEverything = (req, res) => {
    Food.deleteMany().then(result => {
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
    Food.findByIdAndDelete(req.params.id)
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
        active: req.body.active ? req.body.active : true,
        orderBy: req.body.orderBy,
        readyBy: req.body.readyBy,
        collectionOnly: req.body.collectionOnly,
        name: req.body.name,
        cloudKitchenId: req.body.cloudKitchenId,
        collectionId: req.body.collectionId,
        image: req.body.image,
        spice: req.body.spice,
        vegetarian: req.body.vegetarian,
        special: req.body.special,
        preOrder: req.body.preOrder,
        extras: req.body.extras,
        choices: req.body.choices,
        description: req.body.description,
        price: req.body.price,
        // ourPrice: req.body.price + (10 / 100 * req.body.price),
        discountedPrice: req.body.discountedPrice,
        discounted: req.body.discounted,
        slug: req.body.slug || getSlug(req.body.name, req.body.cloudKitchenId)
    };
}

/**
 * Returns the slug from the given name
 * e.g if name = M & S Foods then Slug = m-s-foods
 * Replaces special characters and replace space with -
 * 
 * @param {String} name 
 */
function getSlug(name, cloudKitchenId) {
    return name.trim().replace(/[\W_]+/g, "-").toLowerCase() + "-" + cloudKitchenId.trim().replace(/[\W_]+/g, "-").toLowerCase()
}