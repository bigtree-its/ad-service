const Dish = require('../../model/cloudkitchen/dish.js');
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');

// Create and Save a new Dish
exports.create = (req, res) => {
    console.log("Received request to create new dish " + JSON.stringify(req.body));
    var slug = getSlug(req.body);
    console.log(`Finding if a Dish already exist for: ${slug}`);
    checkDuplicateAndPersist(req, res);

};

async function checkDuplicateAndPersist(req, res) {
    var slug = getSlug(req.body);
    let query = Dish.find();
    query.where('slug', slug);
    var _id = await Dish.exists(query);
    if (_id) {
        console.log(`Dish already exist`);
        res.status(400).send({ message: `Dish already exist` });
    } else {
        persist(req, res);
    }

}


/**
 * Persists new Dish document
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function persist(req, res) {
    const Dish = buildDishObject(req);
    // Save Dish in the database
    Dish.save()
        .then(data => {
            res.status(201).send(data);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Dish."
            });
        });
}


// Retrieve and return all Dish from the database.
exports.lookup = (req, res) => {
    let query = Dish.find();
    if (req.query.name) {
        query.where({
            name: { $regex: ".*" + req.query.name + ".*", $options: "i" },
        });
    }
    query.where({ active: true });
    Dish.find(query).then(result => {
        console.log(`Returning ${result.length} Dishs.`);
        res.send(result);
    }).catch(error => {
        console.log("Error while fetching Dish from database. " + error.message);
        res.status(500).send({
            message: error.message || "Some error occurred while retrieving Dish."
        });
    });
};


// Find a single Dish with a MenuId
exports.findOne = (req, res) => {
    console.log("Received request get a Dish with id " + req.params.id);
    Dish.findOne({ _id: req.params.id })
        .then(sd => {
            if (!sd) {
                return notFound(req, res);
            }
            res.send(sd);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return notFound(req, res);
            }
            return res.status(500).send({ message: "Error while retrieving Dish with id " + req.params.id });
        });
};

// Update a Dish identified by the MenuId in the request
exports.update = (req, res) => {
    console.log("Updating Dish " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "Dish body can not be empty" });
    }
    // Find Dish and update it with the request body
    Dish.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        .then(sd => {
            if (!sd) {
                return notFound(req, res);
            }
            res.send(sd);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return notFound(req, res);
            }
            return res.status(500).send({
                message: "Error updating Dish with id " + req.params.id
            });
        });
};


// Deletes all
exports.deleteEverything = async(req, res) => {
    console.log('Delete Dishs');
    let query = Dish.find();
    if (req.query.name) {
        query.where({
            name: { $regex: ".*" + req.query.name + ".*", $options: "i" },
        });
    }
    Dish.deleteMany(query).then(result => {
        console.log("Deleted: " + JSON.stringify(result))
        res.send({ message: "Deleted Dishs" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all Dishs. ${err.message}`
        });
    });
};

// Delete One
exports.deleteOne = (req, res) => {
    Dish.deleteMany(req.params.id).then(result => {
        console.log("Deleted: " + JSON.stringify(result))
        res.send({ message: "Deleted Dish" });
    }).catch(err => {
        console.log(`Could not delete Dish. ${err.message}`)
        return res.status(500).send({
            message: `Could not delete Dish. ${err.message}`
        });
    });
}


/**
 * Sends 404 HTTP Response with Message
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function notFound(req, res) {
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
        searchCount: req.body.searchCount,
        active: true,
        slug: req.body.slug || getSlug(req.body)
    };
}

/**
 * Returns the slug from the given prefix
 * e.g if prefix = M & S Dishs then Slug = m-s-Dishs
 * Replaces special characters and replace space with -
 * 
 * @param {String} content 
 */
function getSlug(content) {
    return content.name.trim().replace(/[\W_]+/g, "-").toLowerCase()
}