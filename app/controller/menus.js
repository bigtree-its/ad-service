const Menu = require('../model/chef/menu');
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');

// Require Validation Utils
const { validationResult, errorFormatter } = require('./validation');

// Create and Save a new Menu
exports.create = (req, res) => {
    console.log("Creating new menu " + JSON.stringify(req.body));
    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    var slug = getSlug(req.body.name, req.body.chefId);
    console.log(`Finding if a menu already exist for: ${slug}`);

    Menu.exists({ slug: slug }, function(err, result) {
        if (err) {
            return res.status(500).send({ message: `Error while finding Menu for: ${slug}` });
        } else if (result) {
            console.log(`Menu already exist for: ${slug}`);
            res.status(400).send({ message: `Menu already exist for: ${slug}` });
        } else {
            persist(req, res);
        }
    });

};

// Retrieve and return all Menu from the database.
exports.lookup = (req, res) => {
    let query = Menu.find();
    if (req.query.chef) {
        // query.where('name', { $regex: '.*' + req.query.name + '.*' })
        query.where({ chefId: { '$regex': '.*' + req.query.chef + '.*', '$options': 'i' } })
    }
    Menu.find(query).then(result => {
        console.log(`Returning ${result.length} Menus.`);
        res.send(result);
    }).catch(error => {
        console.log("Error while fetching Menu from database. " + error.message);
        res.status(500).send({
            message: error.message || "Some error occurred while retrieving Menu."
        });
    });
};

// Retrieve and return all Menus from the database.
exports.findAll = (req, res) => {
    console.log("Received request to get all menus");
    if (req.query.chef) {
        return this.lookup(req, res);
    } else {
        Menu.find()
        .then(result => {
            console.log(`Returning ${result.length} Menus.`);
            res.send(result);
        })
        .catch(error => {
            console.log("Error while fetching menu from database. " + error.message);
            res.status(500).send({
                message: error.message || "Some error occurred while retrieving menu."
            });
        });
    }

};

// Deletes all
exports.deleteEverything = (req, res) => {
    Menu.remove().then(result => {
        res.send({ message: "Deleted all menus" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all menus. ${err.message}`
        });
    });
};

// Find a single Menu with a MenuId
exports.findOne = (req, res) => {
    console.log("Received request get a menu with id " + req.params.id);
    Menu.findOne({ _id: req.params.id })
        .then(menu => {
            if (!menu) {
                return menuNotFoundWithId(req, res);
            }
            res.send(menu);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return menuNotFoundWithId(req, res);
            }
            return res.status(500).send({ message: "Error while retrieving Menu with id " + req.params.id });
        });
};

// Update a Menu identified by the MenuId in the request
exports.update = (req, res) => {
    console.log("Updating menu " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "Menu body can not be empty" });
    }
    // Find Menu and update it with the request body
    Menu.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        .then(menu => {
            if (!menu) {
                return menuNotFoundWithId(req, res);
            }
            res.send(menu);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return menuNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Error updating Menu with id " + req.params.id
            });
        });
};

// Delete a Menu with the specified MenuId in the request
exports.delete = (req, res) => {
    Menu.findByIdAndRemove(req.params.id)
        .then(menu => {
            if (!menu) {
                return menuNotFoundWithId(req, res);
            }
            res.send({ message: "Menu deleted successfully!" });
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                return menuNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Could not delete Menu with id " + req.params.id
            });
        });
};

/**
 * Persists new Menu document
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function persist(req, res) {
    const menu = buildMenuObject(req);
    // Save Menu in the database
    menu.save()
        .then(data => {
            res.status(201).send(data);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Menu."
            });
        });
}

/**
 * Sends 404 HTTP Response with Message
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function menuNotFoundWithId(req, res) {
    res.status(404).send({ message: `Menu not found with id ${req.params.id}` });
}

/**
 * Builds Menu object from Request
 * 
 * @param {Request} req 
 */
function buildMenuObject(req) {
    return new Menu(buildMenuJson(req));
}

/**
 * Builds Menu Json from Request
 * 
 * @param {Request} req 
 */
function buildMenuJson(req) {
    return {
        name: req.body.name,
        chefId: req.body.chefId,
        collectionId: req.body.collectionId,
        image: req.body.image,
        spice: req.body.spice,
        vegetarian: req.body.vegetarian,
        special: req.body.special,
        extras: req.body.extras,
        choices: req.body.choices,
        description: req.body.description,
        price: req.body.price,
        // ourPrice: req.body.price + (10 / 100 * req.body.price),
        discountedPrice: req.body.discountedPrice,
        discounted: req.body.discounted,
        slug: req.body.slug || getSlug(req.body.name, req.body.chefId)
    };
}

/**
 * Returns the slug from the given name
 * e.g if name = M & S Menus then Slug = m-s-menus
 * Replaces special characters and replace space with -
 * 
 * @param {String} name 
 */
function getSlug(name, chefId) {
    return name.trim().replace(/[\W_]+/g, "-").toLowerCase() + "-" + chefId.trim().replace(/[\W_]+/g, "-").toLowerCase()
}