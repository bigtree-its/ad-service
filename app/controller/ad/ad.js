//Require Ad Model
const Ad = require('../../model/ad/ad.js');
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');
//Require Mongoose
var mongoose = require('mongoose');
//Require Generate Safe Id for Random unique id Generation
// var generateSafeId = require('generate-safe-id');
const Utils = require('../../utils/utils.js');

// Require Validation Utils
const { validationResult, errorFormatter } = require('../validation.js');


// Create and Save a new Ad
exports.create = async(req, res) => {

    console.log("Creating new Ad " + req.body.title);
    /** Check for validation errors */
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: _.uniq(errors.array()) });
    }

    /** Persist */
    checkDuplicateAndPersist(req, res);
};


function checkDuplicateAndPersist(req, res) {
    let query = Ad.find();
    query.where('dateAvailable', req.body.dateAvailable);
    query.where('price', req.body.price);
    query.where('category', req.body.category);
    query.where('address.postcode', req.body.address.postcode);
    if (req.body.address.propertyNumber) {
        query.where('address.propertyNumber', req.body.address.propertyNumber)
    }
    if (req.body.address.addressLine1) {
        query.where('address.addressLine1', req.body.address.addressLine1)
    }
    Ad.exists(query, function(err, result) {
        if (err) {
            return res.status(500).send({ message: `Error while finding Ad ${req.body.address.postcode}` });
        } else if (result) {
            console.error(`Ad already exist`);
            res.status(400).send(Utils.buildError(`Ad already exist.`));
        } else {
            persist(req, res);
        }
    });
}

exports.paginate = (req, res) => {
    req.query.page = req.query.page || 1;
    req.query.limit = req.query.limit || 25;
    const options = { page: req.query.page, limit: req.query.limit };
    let query = Ad.find();
    Ad.aggregatePaginate(query, options, function(err, result) {
        if (result) {
            console.log(`Returning ${result.docs.length} Ads.`);
            res.send(result);
        } else if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving Ads."
            });
        }
    });
}

// Retrieve and return all Ads from the database.
exports.findAll = (req, res) => {
    console.log('Finding Ads..')
    let query = Ad.find();
    if (req.query.minAmount && req.query.maxAmount) {
        query.where('price', { $gte: req.query.minAmount, $lte: req.query.maxAmount });
    } else if (req.query.minAmount && !req.query.maxAmount) {
        query.where('price', { $gte: req.query.minAmount });
    } else if (req.query.maxAmount && !req.query.minAmount) {
        query.where('price', { $lte: req.query.maxAmount });
    }

    if (req.query.category) {
        query.where('category', req.query.category);
    }
    if (req.query.postcode) {
        query.where('address.postcode', req.query.postcode);
    }
    if (req.query.adOwner) {
        query.where('adOwner.email', req.query.adOwner);
    }
    if (req.query.featured) {
        query.where('featured', true);
    }
    if (req.query.approved) {
        query.where('approved', req.query.approved);
    }
    if (req.query.active) {
        query.where('active', req.query.active);
    }
    if (req.query.reference) {
        query.where('reference', req.query.reference)
    }
    if (req.query.status) {
        var statusArray = req.query.status.split(",");
        query.where('status', { $in: statusArray })
    }
    if (req.query.lastWeek) {
        var d = new Date();
        d.setDate(d.getDate() - 7);
        query.where('datePosted', { $gte: d })
    } else if (req.query.lastMonth) {
        var d = new Date();
        d.setDate(d.getDate() - 31);
        query.where('datePosted', { $gte: d })
    }
    Ad.find(query).then(result => {
        console.log(`Returning ${result.length} Ads.`);
        res.send(result);
    }).catch(error => {
        console.log("Error while fetching from database. " + error.message);
        res.status(500).send({
            message: error.message || "Some error occurred while retrieving Ads."
        });
    });
};

// Retrieve and return all Ads from the database.
exports.featured = (req, res) => {
    console.log('Fetching featured Ad');
    let query = Ad.find();
    query.where('featured', 'true')
    Ad.find(query).then(result => {
        console.log(`Returning featured Ad ${result}`);
        res.send(result);
    }).catch(error => {
        res.status(500).send({
            message: err.message || "Some error occurred while retrieving featured Ad."
        });
    });
};


// Find a single Ad with a BrandId
exports.findOne = (req, res) => {
    Ad.findById(req.params.id)
        .then(data => {
            if (!data) {
                res.status(404).send({ message: `Ad not found with id ${req.params.id}` });
            }
            res.send(data);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                res.status(404).send({ message: `Ad not found with id ${req.params.id}` });
            }
            res.status(500).send({ message: `Error while retrieving Ad with id ${req.params.id}` });
        });
};

// Update a Ad 
exports.update = (req, res) => {
    console.log("Updating Ad " + req.params.id);
    // Validate Request
    if (!req.body) {
        res.status(400).send({ message: "Ad body cannot be empty" });
    }
    // Find Ad and update it with the request body
    Ad.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true })
        .then(data => {
            if (!data) {
                res.status(404).send({ message: `Ad not found with id ${req.params.id}` });
            }
            res.send(data);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                res.status(404).send({ message: `Ad not found with id ${req.params.id}` });
            }
            res.status(500).send({ message: `Error updating Ad with id ${req.params.id}` });
        });
};

// Deletes a Ad with the specified BrandId in the request
exports.delete = (req, res) => {
    Ad.findByIdAndRemove(req.params.id)
        .then(data => {
            if (!data) {
                return res.status(404).send({ message: `Ad not found with id ${req.params.id}` });
            }
            res.send({ message: "Ad deleted successfully!" });
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                res.status(404).send({ message: `Ad not found with id ${req.params.id}` });
            }
            res.status(500).send({ message: `Could not delete Ad with id ${req.params.id}` });
        });
};

// Deletes a Ad with the specified BrandId in the request
exports.deleteEverything = (req, res) => {
    Ad.deleteMany().then(result => {
        res.send({ message: "Deleted all Ads" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all Ads. ${err.message}`
        });
    });
};

/**
 * Persists new Ad Model 
 * 
 * @param {Request} req The HTTP Request 
 * @param {Response} res The HTTP Response
 */
function persist(req, res) {

    const Ad = buildAd(req);
    // Save Ad in the database
    Ad.save()
        .then(data => {
            console.log(`Persisted Ad: ${data._id}`);
            res.status(201).send(data);
        }).catch(err => {
            console.error('Save failed. ' + err);
            res.status(500).send({ message: err.message || "Some error occurred while creating the Ad." });
        });
}

/**
 * Builds Ad from incoming Request.
 * @returns Ad Model
 * @param {Request} req 
 */
function buildAd(req) {
    return new Ad(buildAdJson(req));
}

/**
 * Builds Ad JSON incoming Request.
 * 
 * @returns {String} Ad JSON
 * @param {Request} req 
 */
function buildAdJson(req) {
    var data = req.body;
    var safeId = Utils.randomString(9).toUpperCase();
    console.log('Unique reference for this ad ' + safeId)
    return {
        title: data.title,
        category: data.category,
        reference: safeId,
        keyFeatures: data.keyFeatures,
        description: data.description,
        price: data.price,
        dateAvailable: data.dateAvailable || new Date(),
        datePosted: data.datePosted || new Date(),
        image: data.image,
        address: data.address,
        adOwner: data.adOwner,
        status: data.status || 'Available',
        gallery: data.gallery,
        featured: data.featured,
        active: data.active ? data.active : false,
        approved: data.approved ? data.approved : false,
    };
}
/**
 * Returns the slog from the given name
 * e.g if name = M & S Foods then Slug = m-s-foods
 * Replaces special characters and replace space with -
 * 
 * @param {String} name 
 */
function getSlag(name) {
    return name.trim().replace(/[\W_]+/g, "-").toLowerCase()
}