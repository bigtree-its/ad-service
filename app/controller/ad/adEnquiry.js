//Require Ad Model
const Ad = require("../../model/ad/ad.js");
const AdEnquiry = require("../../model/ad/adEnquiry.js");
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require("underscore");
//Require Mongoose
var mongoose = require("mongoose");
//Require Generate Safe Id for Random unique id Generation
// var generateSafeId = require('generate-safe-id');
const Utils = require("../../utils/utils.js");

// Require Validation Utils
const { validationResult, errorFormatter } = require("../validation.js");

// Create and Save a new Ad
exports.create = async(req, res) => {
    console.log("Creating new AdEnquiry for ad " + req.body.reference);
    /** Check for validation errors */
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: _.uniq(errors.array()) });
    }

    var ad = await Ad.find().where("reference").eq(req.body.reference).exec();
    if (!ad) {
        var error = `Ad : ${req.body.reference} not found.`;
        console.error(error);
        return res.status(400).send(Utils.buildError(error));
    }

    /** Persist */
    persist(req, res);
};

// Retrieve and return all Ads from the database.
exports.findAll = (req, res) => {
    let query = AdEnquiry.find();

    if (req.query.category) {
        query.where("category", req.query.category);
    }
    if (req.query.reference) {
        query.where("reference", req.query.reference);
    }
    if (req.query.customer) {
        query.where("customer.email", req.query.customer);
    }
    AdEnquiry.find(query)
        .then((result) => {
            console.log(`Returning ${result.length} enquiries.`);
            res.send(result);
        })
        .catch((error) => {
            console.log(
                "Error while fetching enquiry from database. " + error.message
            );
            res.status(500).send({
                message: error.message || "Some error occurred while retrieving enquiry.",
            });
        });
};

// Find a single AdEnquiry with id
exports.findOne = (req, res) => {
    AdEnquiry.findById(req.params.id)
        .then((data) => {
            if (!data) {
                res
                    .status(404)
                    .send({ message: `AdEnquiry not found with id ${req.params.id}` });
            }
            res.send(data);
        })
        .catch((err) => {
            if (err.kind === "ObjectId") {
                res
                    .status(404)
                    .send({ message: `AdEnquiry not found with id ${req.params.id}` });
            }
            res.status(500).send({
                message: `Error while retrieving AdEnquiry with id ${req.params.id}`,
            });
        });
};

// Update a AdEnquiry
exports.update = async(req, res) => {
    console.log("Updating AdEnquiry " + req.params.id);
    const existing = await AdEnquiry.findById(req.params.id);
    if (existing) {
        console.log('Found existing enquiry ')
        var responses = existing.responses;
        if (responses && req.body.responses) {
            var merged = responses.concat(req.body.responses);
            console.log("Merged responses " + JSON.stringify(merged));
            var updatedResponses = merged.map((obj) => {
                if (!obj.date) {
                    return {...obj, date: new Date() };
                }
                return obj;
            });
            req.body.responses = updatedResponses;
            console.log("Updated date on responses " + JSON.stringify(req.body.responses));
        }
    } else {
        console.log('Could not find existing enquiry ')
    }
    // Validate Request
    if (!req.body) {
        res.status(400).send({ message: "AdEnquiry body cannot be empty" });
    }
    // Find Ad and update it with the request body
    AdEnquiry.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true })
        .then((data) => {
            if (!data) {
                res
                    .status(404)
                    .send({ message: `AdEnquiry not found with id ${req.params.id}` });
            }
            res.send(data);
        })
        .catch((err) => {
            if (err.kind === "ObjectId") {
                res
                    .status(404)
                    .send({ message: `AdEnquiry not found with id ${req.params.id}` });
            }
            res
                .status(500)
                .send({ message: `Error updating AdEnquiry with id ${req.params.id}` });
        });
};

// Deletes a AdEnquiry with the specified BrandId in the request
exports.delete = (req, res) => {
    AdEnquiry.findByIdAndRemove(req.params.id)
        .then((data) => {
            if (!data) {
                return res
                    .status(404)
                    .send({ message: `AdEnquiry not found with id ${req.params.id}` });
            }
            res.send({ message: "AdEnquiry deleted successfully!" });
        })
        .catch((err) => {
            if (err.kind === "ObjectId" || err.name === "NotFound") {
                res
                    .status(404)
                    .send({ message: `AdEnquiry not found with id ${req.params.id}` });
            }
            res
                .status(500)
                .send({
                    message: `Could not delete AdEnquiry with id ${req.params.id}`,
                });
        });
};

// Deletes a AdEnquiry with the specified BrandId in the request
exports.deleteEverything = (req, res) => {
    AdEnquiry.remove()
        .then((result) => {
            res.send({ message: "Deleted all AdEnquiry" });
        })
        .catch((err) => {
            return res.status(500).send({
                message: `Could not delete all AdEnquiry. ${err.message}`,
            });
        });
};

/**
 * Persists new AdEnquiry Model
 *
 * @param {Request} req The HTTP Request
 * @param {Response} res The HTTP Response
 */
function persist(req, res) {
    const adEnquiry = buildAdEnquiry(req);
    // Save AdEnquiry in the database
    adEnquiry
        .save()
        .then((data) => {
            console.log(`Persisted Ad: ${data._id}`);
            res.status(201).send(data);
        })
        .catch((err) => {
            console.error("Save failed. " + err);
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Ad.",
            });
        });
}

/**
 * Builds AdEnquiry from incoming Request.
 * @returns AdEnquiry Model
 * @param {Request} req
 */
function buildAdEnquiry(req) {
    return new AdEnquiry(buildAdEnquiryJson(req));
}

/**
 * Builds AdEnquiry JSON incoming Request.
 *
 * @returns {String} AdEnquiry JSON
 * @param {Request} req
 */
function buildAdEnquiryJson(req) {
    var data = req.body;
    var responses = req.body.responses;
    if (responses && responses.length > 0) {
        console.log("Updating responses..");
        var updatedResponses = responses.map((obj) => {
            if (!obj.date) {
                return {...obj, date: new Date() };
            }
            return obj;
        });
        req.body.responses = updatedResponses;
    }
    return {
        reference: data.reference,
        category: data.category,
        message: data.message,
        adOwner: data.adOwner,
        customer: data.customer,
        responses: data.responses,
        date: data.date || new Date(),
    };
}