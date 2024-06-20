//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');
//Require Generate Safe Id for Random unique id Generation
const Supplier = require('../model/common/supplier');
const { validationResult } = require('express-validator');
const { errorFormatter } = require('./validation');
// Require Validation Utils

function isEmpty(data) {
    if (data === undefined || data === null || data.length === 0) {
        return true;
    }
    return false;
}

// Create and Save a new Supplier
exports.create = async(req, res) => {

    console.log("Creating new Supplier ");
    /** Check for validation errors */
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    /** Persist */
    checkDuplicateAndPersist(req, res);
};


function checkDuplicateAndPersist(req, res) {
    console.log(`Checking if Supplier already exist..`);
    Supplier.exists({ email: req.body.email }, function(err, result) {
        if (err) {
            return res.status(500).send({ message: `Error while finding Supplier with email ${req.body.email}` });
        } else if (result) {
            console.log(`Supplier already exist`);
            return res.status(400).send({ message: `Supplier already exist.` });
        } else {
            persist(req, res);
        }
    });
}

exports.paginate = (req, res) => {
    req.query.page = req.query.page || 1;
    req.query.limit = req.query.limit || 25;
    const options = { page: req.query.page, limit: req.query.limit };
    let query = Supplier.find();
    if (req.query.name) {
        query.where('name', { $regex: '.*' + req.query.name + '.*' })
    }
    if (req.query.email) {
        query.where('email', { $in: req.query.email })
    }
    if (req.query.postcode) {
        query.where('address.postcode', { $in: req.query.postcode })
    }
    Supplier.aggregatePaginate(query, options, function(err, result) {
        if (result) {
            console.log(`Returning ${result.docs.length} Suppliers.`);
            res.send(result);
        } else if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving Suppliers."
            });
        }
    });
}

// Retrieve and return all Suppliers from the database.
exports.findAll = (req, res) => {
    console.log('Finding Suppliers..')
    let query = Supplier.find();

    if (req.query.active) {
        query.where('active', req.query.active)
    }
    if (req.query.delivery) {
        query.where('delivery', true);
    }
    if (req.query.noMinimumOrder) {
        query.where('minimumOrder', 0);
    }
    if (req.query.email) {
        query.where('email', req.query.email)
    }
    Supplier.find(query)
        .then(result => {
            console.log(`Returning ${result.length} Suppliers.`);
            res.send(result);
        }).catch(error => {
            console.log("Error while fetching from database. " + error.message);
            res.status(500).send({
                message: error.message || "Some error occurred while retrieving Suppliers."
            });
        });
};

// Find a single Supplier with a BrandId
exports.findOne = (req, res) => {
    console.log(`Finding a Supplier ${req.params.id}`);
    Supplier.findById(req.params.id)
        .then(data => {
            if (!data) {
                return res.status(404).send({ message: `Supplier not found with id ${req.params.id}` });
            }
            res.send(data);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({ message: `Supplier not found with id ${req.params.id}` });
            }
            return res.status(500).send({ message: `Error while retrieving Supplier with id ${req.params.id}` });
        });
};

// Update a Supplier 
exports.update = (req, res) => {
    console.log(`Updating Supplier ${req.params.id}`);
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "Supplier body cannot be empty" });
    }
    // Find Supplier and update it with the request body
    Supplier.findByIdAndUpdate({ _id: req.params.id }, req.body, { upsert: true, setDefaultsOnInsert: true, new: true })
        .then(Supplier => {
            if (!Supplier) {
                return res.status(404).send({ message: `Supplier not found with id ${req.params.id}` });
            }
            res.send(Supplier);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({ message: `Supplier not found with id ${req.params.id}` });
            }
            return res.status(500).send({ message: `Error updating Supplier with id ${req.params.id}` });
        });
};

// Deletes a Supplier with the specified BrandId in the request
exports.delete = (req, res) => {
    Supplier.findByIdAndRemove(req.params.id)
        .then(Supplier => {
            if (!Supplier) {
                return res.status(404).send({ message: `Supplier not found with id ${req.params.id}` });
            }
            res.send({ message: "Supplier deleted successfully!" });
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                return res.status(404).send({ message: `Supplier not found with id ${req.params.id}` });
            }
            return res.status(500).send({
                message: `Could not delete Supplier with id ${req.params.id}`
            });
        });
};

// Deletes a Supplier with the specified BrandId in the request
exports.deleteEverything = (req, res) => {
    Supplier.remove().then(result => {
        res.send({ message: "Deleted all Suppliers" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all Suppliers. ${err.message}`
        });
    });
};

/**
 * Persists new Supplier Model 
 * 
 * @param {Request} req The HTTP Request 
 * @param {Response} res The HTTP Response
 */
function persist(req, res) {

    const obj = buildSupplier(req);
    console.log(`Attempting to persist Supplier ` + JSON.stringify(obj));
    // Save Supplier in the database
    obj.save()
        .then(data => {
            console.log(`Persisted Supplier: ${data._id}`);
            res.status(201).send(data);
        }).catch(err => {
            console.error('Save failed. ' + err);
            res.status(500).send({ message: err.message || "Some error occurred while creating the Supplier." });
        });
}

/**
 * Builds Supplier from incoming Request.
 * @returns Supplier Model
 * @param {Request} req 
 */
function buildSupplier(req) {
    return new Supplier(fromJson(req));
}

/**
 * Builds Supplier JSON incoming Request.
 * 
 * @returns {String} Supplier JSON
 * @param {Request} req 
 */
function fromJson(req) {
    var data = req.body;
    var slug = "";
    if (data.tradingName) {
        slug = getSlug(data.tradingName);
    } else {
        slug = getSlug(data.name);
    }
    return {
        name: data.name,
        slug: slug,
        tradingName: data.tradingName,
        description: data.description,
        image: data.image,
        email: data.email,
        address: data.address,
        deliveryFee: data.deliveryFee,
        freeDeliveryOver: data.freeDeliveryOver,
        packagingFee: data.packagingFee,
        deliveryMinimum: data.deliveryMinimum,
        deliveryDistance: data.deliveryDistance,
        minimumOrder: data.minimumOrder,
        rating: data.rating,
        reviews: data.reviews,
        doDelivery: data.doDelivery,
        preOrderOnly: data.preOrderOnly,
        paymentRequireApproval: data.paymentRequireApproval,
        active: data.active,
        contact: data.contact
    };
}
/**
 * Returns the slog from the given name
 * e.g if name = M & S Foods then Slug = m-s-foods
 * Replaces special characters and replace space with -
 * 
 * @param {String} name 
 */
function getSlug(name) {
    return name.trim().replace(/[\W_]+/g, "-").toLowerCase()
}