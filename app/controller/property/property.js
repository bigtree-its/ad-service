//Require Property Model
const Property = require("../../model/property/property");
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require("underscore");
//Require Mongoose
var mongoose = require("mongoose");
//Require Generate Safe Id for Random unique id Generation
// var generateSafeId = require('generate-safe-id');
const Utils = require("../../utils/utils.js");

// Require Validation Utils
const { validationResult, errorFormatter } = require("../validation");

// Create and Save a new Property
exports.create = async(req, res) => {
    console.log("Creating new Property " + req.body.title);
    /** Check for validation errors */
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: _.uniq(errors.array()) });
    }

    var error = validateTenure(req);
    if (error) {
        console.error(error);
        return res.status(400).send(Utils.buildError(error));
    }

    // try {
    //     validateAddress(req, res);
    // } catch (error) {
    //     console.log(error);
    //     return res.status(400).send({ message: `${error}` });
    // }
    var error = validateStatus(req);
    if (error) {
        console.error(error);
        return res.status(400).send(Utils.buildError(error));
    }

    /** Persist */
    checkDuplicateAndPersist(req, res);
};

function validateTenure(req) {
    if (req.body.type === "Garage" || req.body.type === "Commercial") {
        return;
    }
    var types = ["Freehold", "Leasehold", "Shared"];
    var valid = false;
    var tenure = req.body.tenure;
    if (tenure) {
        var length = types.length;
        while (length--) {
            if (tenure.indexOf(types[length]) != -1) {
                valid = true;
            }
        }
    } else {
        return "Property Tenure is mandatory";
    }
    if (!valid) {
        return "Invalid Property Tenure ${tenure}";
    }
}

function validateAddress(req, res) {
    var address = req.body.address;
    if (address) {
        if (!address.propertyNumber || !address.postcode) {
            return `Property number and postcode is mandatory`;
        }
    } else {
        return `Property Address is mandatory`;
    }
}

function validateStatus(req, res) {
    var types = ["Under Offer", "Available", "Let Agreed", "Sold"];
    var valid = false;
    var status = req.body.status;
    if (status) {
        var length = types.length;
        while (length--) {
            if (status.indexOf(types[length]) != -1) {
                valid = true;
            }
        }
    }
    if (valid === false) {
        return `Invalid Property Status ${status}`;
    }
}

function checkDuplicateAndPersist(req, res) {
    let query = Property.find();
    query.where("address.postcode", req.body.address.postcode);
    if (req.body.address.propertyNumber) {
        query.where("address.propertyNumber", req.body.address.propertyNumber);
    }
    if (req.body.address.addressLine1) {
        query.where("address.addressLine1", req.body.address.addressLine1);
    }
    Property.exists(query, function(err, result) {
        if (err) {
            return res
                .status(500)
                .send({
                    message: `Error while finding Property with property number ${req.body.address.propertyNumber}`,
                });
        } else if (result) {
            console.error(`Property already exist`);
            res.status(400).send(Utils.buildError(`Property already exist.`));
        } else {
            persist(req, res);
        }
    });
}

exports.paginate = (req, res) => {
    req.query.page = req.query.page || 1;
    req.query.limit = req.query.limit || 25;
    const options = { page: req.query.page, limit: req.query.limit };
    let query = Property.find();
    if (req.query.name) {
        query.where("name", { $regex: ".*" + req.query.name + ".*" });
    }
    if (req.query.categories) {
        this.validateCategory(res, req.query.categories);
        query.where("categories", { $in: req.query.categories });
    }
    Property.aggregatePaginate(query, options, function(err, result) {
        if (result) {
            console.log(`Returning ${result.docs.length} Properties.`);
            res.send(result);
        } else if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving Properties.",
            });
        }
    });
};

// Retrieve and return all Properties from the database.
exports.findAll = (req, res) => {
    console.log("Finding properties..");
    let query = Property.find();
    if (req.query.minAmount && req.query.maxAmount) {
        query.where("price", {
            $gte: req.query.minAmount,
            $lte: req.query.maxAmount,
        });
    } else if (req.query.minAmount && !req.query.maxAmount) {
        query.where("price", { $gte: req.query.minAmount });
    } else if (req.query.maxAmount && !req.query.minAmount) {
        query.where("price", { $lte: req.query.maxAmount });
    }
    if (req.query.minBedroom && req.query.maxBedroom) {
        query.where("bedrooms", {
            $gte: req.query.minBedroom,
            $lte: req.query.maxBedroom,
        });
    } else if (req.query.minBedroom && !req.query.maxBedroom) {
        query.where("bedrooms", { $gte: req.query.minBedroom });
    } else if (req.query.maxBedroom && !req.query.minBedroom) {
        query.where("bedrooms", { $lte: req.query.maxBedroom });
    }

    if (req.query.type) {
        query.where("type", req.query.type);
    }
    if (req.query.location) {
        query.where("address.city", req.query.location);
    }
    if (req.query.postcode) {
        query.where("address.postcode", req.query.postcode);
    }
    if (req.query.owner) {
        query.where("adOwner.email", req.query.owner);
    }
    if (req.query.featured) {
        query.where("featured", true);
    }
    if (req.query.approved) {
        query.where("approved", req.query.approved);
    }
    if (req.query.active) {
        query.where("active", req.query.active);
    }
    if (req.query.types) {
        var typeIds = req.query.types;
        var types = typeIds.split(",");
        query.where("type", { $in: types });
    }
    if (req.query.consumptionType) {
        query.where("consumptionType", req.query.consumptionType);
    }
    if (req.query.reference) {
        query.where("reference", req.query.reference);
    }
    if (req.query.status) {
        var statusArray = req.query.status.split(",");
        query.where("status", { $in: statusArray });
    }
    if (req.query.lastWeek) {
        var d = new Date();
        d.setDate(d.getDate() - 7);
        query.where("datePosted", { $gte: d });
    } else if (req.query.lastMonth) {
        var d = new Date();
        d.setDate(d.getDate() - 31);
        query.where("datePosted", { $gte: d });
    }
    Property.find(query)
        .then((result) => {
            console.log(`Returning ${result.length} Properties.`);
            res.send(result);
        })
        .catch((error) => {
            console.log("Error while fetching from database. " + error.message);
            res.status(500).send({
                message: error.message || "Some error occurred while retrieving Properties.",
            });
        });
};

// Retrieve and return all Properties from the database.
exports.featured = (req, res) => {
    console.log("Fetching featured Property");
    let query = Property.find();
    query.where("featured", "true");
    Property.find(query)
        .then((result) => {
            console.log(`Returning featured Property ${result}`);
            res.send(result);
        })
        .catch((error) => {
            res.status(500).send({
                message: err.message ||
                    "Some error occurred while retrieving featured Property.",
            });
        });
};

// Find a single Property with a BrandId
exports.findOne = (req, res) => {
    Property.findById(req.params.id)
        .then((data) => {
            if (!data) {
                res
                    .status(404)
                    .send({ message: `Property not found with id ${req.params.id}` });
            }
            res.send(data);
        })
        .catch((err) => {
            if (err.kind === "ObjectId") {
                res
                    .status(404)
                    .send({ message: `Property not found with id ${req.params.id}` });
            }
            res
                .status(500)
                .send({
                    message: `Error while retrieving Property with id ${req.params.id}`,
                });
        });
};

// Update a Property
exports.update = (req, res) => {
    console.log("Updating Property " + req.params.id);
    // Validate Request
    if (!req.body) {
        res.status(400).send({ message: "Property body cannot be empty" });
    }
    // Find Property and update it with the request body
    Property.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true })
        .then((data) => {
            if (!data) {
                res
                    .status(404)
                    .send({ message: `Property not found with id ${req.params.id}` });
            }
            res.send(data);
        })
        .catch((err) => {
            if (err.kind === "ObjectId") {
                res
                    .status(404)
                    .send({ message: `Property not found with id ${req.params.id}` });
            }
            res
                .status(500)
                .send({ message: `Error updating Property with id ${req.params.id}` });
        });
};

// Deletes a Property with the specified BrandId in the request
exports.delete = (req, res) => {
    Property.findByIdAndRemove(req.params.id)
        .then((data) => {
            if (!data) {
                return res
                    .status(404)
                    .send({ message: `Property not found with id ${req.params.id}` });
            }
            res.send({ message: "Property deleted successfully!" });
        })
        .catch((err) => {
            if (err.kind === "ObjectId" || err.name === "NotFound") {
                res
                    .status(404)
                    .send({ message: `Property not found with id ${req.params.id}` });
            }
            res
                .status(500)
                .send({
                    message: `Could not delete Property with id ${req.params.id}`,
                });
        });
};

// Deletes a Property with the specified BrandId in the request
exports.deleteEverything = (req, res) => {
    Property.remove()
        .then((result) => {
            res.send({ message: "Deleted all Properties" });
        })
        .catch((err) => {
            return res.status(500).send({
                message: `Could not delete all Properties. ${err.message}`,
            });
        });
};

/**
 * Persists new Property Model
 *
 * @param {Request} req The HTTP Request
 * @param {Response} res The HTTP Response
 */
function persist(req, res) {
    const property = buildProperty(req);
    // Save Property in the database
    property
        .save()
        .then((data) => {
            console.log(`Persisted Property: ${data._id}`);
            res.status(201).send(data);
        })
        .catch((err) => {
            console.error("Save failed. " + err);
            res
                .status(500)
                .send({
                    message: err.message || "Some error occurred while creating the Property.",
                });
        });
}

/**
 * Builds Property from incoming Request.
 * @returns Property Model
 * @param {Request} req
 */
function buildProperty(req) {
    return new Property(buildPropertyJson(req));
}

/**
 * Builds Property JSON incoming Request.
 *
 * @returns {String} Property JSON
 * @param {Request} req
 */
function buildPropertyJson(req) {
    var data = req.body;
    var safeId = Utils.randomString(9);
    return {
        title: data.title,
        type: data.type,
        tenure: data.tenure,
        consumptionType: data.consumptionType,
        size: data.size,
        reference: safeId,
        status: data.status,
        summary: data.summary,
        keyFeatures: data.keyFeatures,
        description: data.description,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        rentPeriod: data.rentPeriod,
        price: data.price,
        saleAmountOfferOver: data.saleAmountOfferOver,
        stations: data.stations,
        schools: data.schools,
        hospitals: data.hospitals,
        malls: data.malls,
        shops: data.shops,
        leisureCenters: data.leisureCenters,
        parks: data.parks,
        superStores: data.superStores,
        dateAvailable: data.dateAvailable || new Date(),
        datePosted: data.datePosted || new Date(),
        image: data.image,
        address: data.address,
        adOwner: data.adOwner,
        status: data.status || "Available",
        gallery: data.gallery,
        floorPlan: data.floorPlan,
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
    return name
        .trim()
        .replace(/[\W_]+/g, "-")
        .toLowerCase();
}