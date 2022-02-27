const Carousel = require('../model/carousel');

//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');

// Require Validation Utils
const { validationResult, errorFormatter } = require('./validation');

// Create and Save a new Carousel
exports.create = (req, res) => {
    console.log("Creating new carousel " + JSON.stringify(req.body));
    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    console.log(`Finding if a carousel already exist for a property ${req.body.property}`);
    Carousel.exists({ property: req.body.property }, function (err, result) {
        if (err) {
            return res.status(500).send({ message: `Error while finding Carousel for property ${req.body.property}` });
        } else if (result) {
            console.log(`Carousel already exist for property ${req.body.property}`);
            res.status(400).send({ message: `Carousel already exist for property ${req.body.property}` });
        } else {
            if (req.body.active == true) {
                activeCheck(req, res);
            } else {
                persist(req, res);
            }
        }
    });

};

/**
 * Check if an active carousel already exist.
 * Maximum one active carousel allowed
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function activeCheck(req, res) {
    Carousel.exists({ active: true }, function (err, result) {
        if (err) {
            console.log(`Error while finding Active Carousel: ${err}`);
            return res.status(500).send({ message: `Cannot create carousel. Internal Server Error` });
        } else if (result) {
            console.log(`An active carousel already exist`);
            res.status(400).send({ message: `An active carousel already exist` });
        } else {
            persist(req, res);
        }
    });
}


// Retrieve and return all carousels from the database.
exports.findAll = (req, res) => {
    console.log("Received request to get all carousels");
    Carousel.find()
        .then(data => {
            if (data) {
                console.log("Returning " + data.length + " carousels.");
                res.send(data);
            } else {
                console.log("Returning no carousels ");
                res.send({});
            }
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving carousels."
            });
        });
};

// Find a single Carousel with a Id
exports.findOne = (req, res) => {
    console.log("Received request get a carousel with id " + req.params.id);
    Carousel.findById(req.params.id)
        .then(carousel => {
            if (!carousel) {
                return carouselNotFoundWithId(req, res);
            }
            res.send(carousel);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return carouselNotFoundWithId(req, res);
            }
            return res.status(500).send({ message: "Error while retrieving Carousel with id " + req.params.id });
        });
};

// Update a Carousel identified by the BrandId in the request
exports.update = (req, res) => {
    console.log("Updating carousel " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "Carousel body can not be empty" });
    }
    // Find Carousel and update it with the request body
    Carousel.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        .then(carousel => {
            if (!carousel) {
                return carouselNotFoundWithId(req, res);
            }
            res.send(carousel);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return carouselNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Error updating Carousel with id " + req.params.id
            });
        });
};

// Delete a Carousel with the specified BrandId in the request
exports.delete = (req, res) => {
    Carousel.findByIdAndRemove(req.params.id)
        .then(carousel => {
            if (!carousel) {
                return carouselNotFoundWithId(req, res);
            }
            res.send({ message: "Carousel deleted successfully!" });
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                return carouselNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Could not delete Carousel with id " + req.params.id
            });
        });
};

/**
 * Persists new Carousel document
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function persist(req, res) {
    const carousel = buildCarouselObject(req);
    // Save Carousel in the database
    carousel.save()
        .then(data => {
            res.status(201).send(data);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Carousel."
            });
        });
}

/**
 * Sends 404 HTTP Response with Message
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function carouselNotFoundWithId(req, res) {
    res.status(404).send({ message: `Carousel not found with id ${req.params.id}` });
}

/**
 * Builds Carousel object from Request
 * 
 * @param {Request} req 
 */
function buildCarouselObject(req) {
    return new Carousel(buildCarouselJson(req));
}

/**
 * Builds Carousel Json from Request
 * 
 * @param {Request} req 
 */
function buildCarouselJson(req) {
    return {
        property: req.body.property,
        image: req.body.image,
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        coming: req.body.coming,
        active: req.body.active
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