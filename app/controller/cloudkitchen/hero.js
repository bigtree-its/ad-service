const Hero = require('../../model/cloudkitchen/hero.js');
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');

// Create and Save a new Hero
exports.create = (req, res) => {
    console.log("Received request to create new hero " + JSON.stringify(req.body));
    var slug = getSlug(req.body);
    console.log(`Finding if a Hero already exist for: ${slug}`);
    checkDuplicateAndPersist(req, res);

};

async function checkDuplicateAndPersist(req, res) {
    var slug = getSlug(req.body);
    let query = Hero.find();
    query.where('slug', slug);
    var _id = await Hero.exists(query);
    if (_id) {
        console.log(`Hero already exist`);
        res.status(400).send({ message: `Hero already exist` });
    } else {
        persist(req, res);
    }

}


/**
 * Persists new Hero document
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function persist(req, res) {
    const Hero = buildHeroObject(req);
    // Save Hero in the database
    Hero.save()
        .then(data => {
            res.status(201).send(data);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Hero."
            });
        });
}


// Retrieve and return all Hero from the database.
exports.lookup = (req, res) => {
    let query = Hero.find();
    if (req.query.name) {
        query.where({
            name: { $regex: ".*" + req.query.name + ".*", $options: "i" },
        });
    }
    query.where({ active: true });
    Hero.find(query).then(result => {
        console.log(`Returning ${result.length} Heros.`);
        res.send(result);
    }).catch(error => {
        console.log("Error while fetching Hero from database. " + error.message);
        res.status(500).send({
            message: error.message || "Some error occurred while retrieving Hero."
        });
    });
};


// Find a single Hero with a MenuId
exports.findOne = (req, res) => {
    console.log("Received request get a Hero with id " + req.params.id);
    Hero.findOne({ _id: req.params.id })
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
            return res.status(500).send({ message: "Error while retrieving Hero with id " + req.params.id });
        });
};

// Update a Hero identified by the MenuId in the request
exports.update = (req, res) => {
    console.log("Updating Hero " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "Hero body can not be empty" });
    }
    // Find Hero and update it with the request body
    Hero.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
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
                message: "Error updating Hero with id " + req.params.id
            });
        });
};


// Deletes all
exports.deleteEverything = async(req, res) => {
    console.log('Delete Heros');
    let query = Hero.find();
    if (req.query.name) {
        query.where({
            name: { $regex: ".*" + req.query.name + ".*", $options: "i" },
        });
    }
    Hero.deleteMany(query).then(result => {
        console.log("Deleted: " + JSON.stringify(result))
        res.send({ message: "Deleted Heros" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all Heros. ${err.message}`
        });
    });
};

// Delete One
exports.deleteOne = (req, res) => {
    Hero.deleteMany(req.params.id).then(result => {
        console.log("Deleted: " + JSON.stringify(result))
        res.send({ message: "Deleted Hero" });
    }).catch(err => {
        console.log(`Could not delete Hero. ${err.message}`)
        return res.status(500).send({
            message: `Could not delete Hero. ${err.message}`
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
    res.status(404).send({ message: `Hero not found with id ${req.params.id}` });
}

/**
 * Builds Hero object from Request
 * 
 * @param {Request} req 
 */
function buildHeroObject(req) {
    return new Hero(buildHeroJson(req));
}

/**
 * Builds Hero Json from Request
 * 
 * @param {Request} req 
 */
function buildHeroJson(req) {
    return {
        name: req.body.name,
        image: req.body.image,
        active: true,
        slug: req.body.slug || getSlug(req.body)
    };
}

/**
 * Returns the slug from the given prefix
 * e.g if prefix = M & S Heros then Slug = m-s-Heros
 * Replaces special characters and replace space with -
 * 
 * @param {String} content 
 */
function getSlug(content) {
    return content.name.trim().replace(/[\W_]+/g, "-").toLowerCase()
}