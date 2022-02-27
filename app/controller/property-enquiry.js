
// Require PropertyEnquiry Model
const PropertyEnquiry = require('../model/property-enquiry');

// Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');

// Require Mongoose
var mongoose = require('mongoose');

// Require Validation Utils
const { validationResult, errorFormatter } = require('./validation');

// Create and Save a new PropertyEnquiry
exports.create = (req, res) => {
    
    console.log("Creating new PropertyEnquiry " + JSON.stringify(req.body));
    
    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);
    
    if (!errors.isEmpty()) {
        var err = _.uniq(errors.array());
        console.log('Cannot create enquiry: ' + err);
        return res.json({ errors: err });
    }
    // checkDuplicateAndPersist(req, res);
    persist(req, res);
};

function checkDuplicateAndPersist(req, res) {
    
    console.log(`Checking if a enquiry already exist for property ${req.body.property} from customer ${req.body.email}`);
    
    PropertyEnquiry.exists({ email: req.body.email, property: req.body.property }, function(err, result) {
        if (err) {
            return res.status(500).send({ message: `Error while finding PropertyEnquiry for property:${req.body.property}` });
        } else if (result) {
            console.log(`PropertyEnquiry already exist for Product:${req.body.property}`);
            res.status(400).send({ message: `You have already posted this enquiry for this property` });
        } else {
            persist(req, res);
        }
    });
}

// Retrieve and return all PropertyEnquirys from the database.
exports.findAll = (req, res, next) => {
    
    var query = PropertyEnquiry.find();
    
    if (req.query.property) {
        query.where("property").equals(req.query.property);
    }
    
    if (req.query.email) {
        query.where("email").equals(req.query.email);
    }
    
    PropertyEnquiry.find(query).sort({ date: -1 }).then(result => {
        if (result) {
            console.log(`Returning ${result.length} enquirys.`);
            res.send(result);
        } else {
            console.log("Returning no PropertyEnquiries");
            res.send({});
        }
    }).catch(err => { res.status(500).send({ message: err.message }) });
};

// Find a single PropertyEnquiry with a ID
exports.findOne = (req, res) => {
    
    PropertyEnquiry.findById(req.params.id)
        .then(PropertyEnquiry => {
            if (!PropertyEnquiry) {
                return res.status(404).send({ message: `PropertyEnquiry not found with id ${req.params.id}` });
            }
            res.send(PropertyEnquiry);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({ message: `PropertyEnquiry not found with id ${req.params.id}` });
            }
            return res.status(500).send({ message: `Error while retrieving PropertyEnquiry with id ${req.params.id}` });
        });
};

// Update a PropertyEnquiry identified by the BrandId in the request
exports.update = (req, res) => {
    
    console.log("Updating PropertyEnquiry " + JSON.stringify(req.body));
    
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "PropertyEnquiry body can not be empty" });
    }

    // Find PropertyEnquiry and update it with the request body
    PropertyEnquiry.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        .then(PropertyEnquiry => {
            if (!PropertyEnquiry) {
                return res.status(404).send({ message: `PropertyEnquiry not found with id ${req.params.id}` });
            }
            res.send(PropertyEnquiry);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({ message: `PropertyEnquiry not found with id ${req.params.id}` });
            }
            return res.status(500).send({ message: `Error updating PropertyEnquiry with id ${req.params.id}` });
        });
};

// Delete a PropertyEnquiry with the specified BrandId in the request
exports.delete = (req, res) => {
    PropertyEnquiry.findByIdAndRemove(req.params.id)
        .then(PropertyEnquiry => {
            if (!PropertyEnquiry) {
                return res.status(404).send({ message: `PropertyEnquiry not found with id ${req.params.id}` });
            }
            res.send({ message: "PropertyEnquiry deleted successfully!" });
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                return res.status(404).send({ message: `PropertyEnquiry not found with id ${req.params.id}` });
            }
            return res.status(500).send({
                message: `Could not delete PropertyEnquiry with id ${req.params.id}`
            });
        });
};

exports.deleteAll = (req, res) => {
    
    PropertyEnquiry.remove().then(result => {
        res.send({ message: "Deleted all enquirys" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all PropertyEnquirys. ${err.message}`
        });
    });
}

exports.deleteAllForProperty = (req, res) => {
    PropertyEnquiry.findByIdAndRemove(req.params.id).then(result => {
        res.send({ message: `Deleted all enquirys for property ${req.params.id}` });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all PropertyEnquirys. ${err.message}`
        });
    });
}

/**
 * Persists new PropertyEnquiry Model 
 * 
 * @param {Request} req The HTTP Request 
 * @param {Response} res The HTTP Response
 */
function persist(req, res) {
    
    console.log(`Attempting to persist PropertyEnquiry ` + JSON.stringify(req.body));
    
    const PropertyEnquiry = buildPropertyEnquiry(req);
    
    // Save PropertyEnquiry in the database
    PropertyEnquiry.save()
        .then(data => {
            console.log(`Persisted PropertyEnquiry: ${data._id}`);
            res.status(201).send(data);
        }).catch(err => {
            res.status(500).send({ message: err.message || "Some error occurred while creating the PropertyEnquiry." });
        });
}

/**
 * Builds PropertyEnquiry from incoming Request.
 
 * @returns PropertyEnquiry Model
 * @param {Request} req 
 */
function buildPropertyEnquiry(req) {
    return new PropertyEnquiry(buildPropertyEnquiryJson(req));
}

/**
 * Builds PropertyEnquiry JSON incoming Request.
 * 
 * @returns {String} PropertyEnquiry JSON
 * @param {Request} req 
 */
function buildPropertyEnquiryJson(req) {
    var data = _.pick(req.body, 'enquiry', 'email', 'firstname','lastname', 'mobile', 'date', 'postcode', 'property')
    if (!data.date) {
        data.date = new Date();
    }
    
    if (!data.email) {
        data.email = 'Anonymous';
    }

    return data;
}