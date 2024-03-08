//Require Property Model
const Property = require('../../model/property/property');
const PropertyType = require('../../model/property/type');
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');
//Require Mongoose
var mongoose = require('mongoose');
//Require Generate Safe Id for Random unique id Generation
var generateSafeId = require('generate-safe-id');
// Require Validation Utils
const { validationResult, errorFormatter } = require('../validation');

function isEmpty(data){
    if ( data === undefined || data === null || data.length === 0){
        return true;
    }
    return false;
}

// Create and Save a new Property
exports.create = async(req, res) => {

    console.log("Creating new Property " + JSON.stringify(req.body));
    /** Check for validation errors */
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }

    /** Validate if the given department is correct */
    try{
        this.validateType(req, res, );
    } catch (error) {
        console.log("Error: " + error);
        return res.status(400).send({ message: error });
    }
    try{
        validateTenure(req, res);
    } catch (error) {
        console.log("Error: " + error);
        return res.status(400).send({ message: error });
    }
    try{
        validateStatus(req, res);
    } catch (error) {
        console.log("Error: " + error);
        return res.status(400).send({ message: error });
    }
    /** Persist */
    checkDuplicateAndPersist(req, res);
};

exports.validateType = async(req, res) => {
    try {
        var types = req.body.type;
        if ( isEmpty(types)){
            throw new Error(`PropertyType is Mandatory`);
        }
        console.log('Verifying type : '+ types);
        var ids = types.split(",");
        var records = await PropertyType.find().where('_id').in(ids).exec();
        console.log("Verified PropertyType: " + records);
        if (!records) {
            throw new Error(`PropertyType : ${types} not valid.`);
        }
    } catch (error) {
        throw new Error(`Cannot find PropertyType ${types}`);
    }
};


function validateTenure(req, res)  {
    var types = ['Freehold', 'Leasehold', 'Shared'];
    var valid = false;
    var tenure = req.body.tenure;
    if ( tenure){
        var length = types.length;
        while(length--) {
            if (tenure.indexOf(types[length]) != -1) {
                valid = true;
            }
         }
    }
    if ( valid === false){
        console.log(`Invalid Property Tenure ${tenure}`);
        return res.status(400).send({ message: `Invalid Property Tenure ${tenure}`});
    }
}

function validateStatus(req, res)  {
    var types = ['Under Offer', 'Available', 'Let Agreed', 'Sold'];
    var valid = false;
    var status = req.body.status;
    if ( status){
        var length = types.length;
        while(length--) {
            if (status.indexOf(types[length]) != -1) {
                valid = true;
            }
         }
    }
    if ( valid === false){
        console.log(`Invalid Property Status ${status}`);
        return res.status(400).send({ message: `Invalid Property Status ${status}`});
    }
}


function checkDuplicateAndPersist(req, res) {
    console.log(`Checking if Property already exist..`);
    Property.exists({ property_number: req.body.address.propertyNumber, postcode: req.body.address.postcode }, function(err, result) {
        if (err) {
            return res.status(500).send({ message: `Error while finding Property with property number ${req.body.address.propertyNumber}` });
        } else if (result) {
            console.log(`Property already exist`);
            res.status(400).send({ message: `Property already exist.` });
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
        query.where('name', { $regex: '.*' + req.query.name + '.*' })
    }
    if (req.query.categories) {
        this.validateCategory(res, req.query.categories);
        query.where('categories', { $in: req.query.categories })
    }
    Property.aggregatePaginate(query, options, function(err, result) {
        if (result) {
            console.log(`Returning ${result.docs.length} Properties.`);
            res.send(result);
        } else if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving Properties."
            });
        }
    });
}

// Retrieve and return all Properties from the database.
exports.findAll = (req, res) => {
    console.log('Finding properties..')
    let query = Property.find();
    if (req.query.min_bedroom) {
        query.where('bedrooms', {  $gte : req.query.min_bedroom })
    }
    if (req.query.max_bedroom) {
        query.where('bedrooms', {  $lte : req.query.min_bedroom })
    }
    if (req.query.featured) {
        query.where('featured', 'true')
    }
    if (req.query.types) {
        this.validateType(req, res, req.query.types);
        var typeIds = req.query.types;
        var ids = typeIds.split(",");
        query.where('type', { $in: ids })
    }
    if (req.query.consumption_type) {
        query.where('consumptionType', req.query.consumption_type )
    }
    if (req.query.postcode) {
        query.where('address.postcode', postcode)
    }
    if (req.query.contact_person) {
        query.where('contact.person', req.query.contact_person)
    }
    if (req.query.status) {
        var statusArray = req.query.status.split(",");
        query.where('status', { $in: statusArray })
    }
    if (req.query.last7days) {
        var d = new Date();
        d.setDate(d.getDate()-7);
        query.where('liveDate', {  $gte : d })
    }else if(req.query.last1month) {
        var d = new Date();
        d.setDate(d.getDate()-31);
        query.where('liveDate', {  $gte : d })
    }
    Property.find(query).populate("type", "name").then(result => {
        console.log(`Returning ${result.length} Properties.`);
        res.send(result);
    }).catch(error => {
        console.log("Error while fetching from database. " + error.message);
        res.status(500).send({
            message: error.message || "Some error occurred while retrieving Properties."
        });
    });
};

// Retrieve and return all Properties from the database.
exports.featured = (req, res) => {
    console.log('Fetching featured Property');
    let query = Property.find();
    query.where('featured', 'true')
    Property.find(query).populate("type", "name").then(result => {
        console.log(`Returning featured Property ${result}`);
        res.send(result);
    }).catch(error => {
        res.status(500).send({
            message: err.message || "Some error occurred while retrieving featured Property."
        });
    });
};


// Find a single Property with a BrandId
exports.findOne = (req, res) => {
    Property.findById(req.params.id).populate("type", "name")
        .then(Property => {
            if (!Property) {
                return res.status(404).send({ message: `Property not found with id ${req.params.id}` });
            }
            res.send(Property);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({ message: `Property not found with id ${req.params.id}` });
            }
            return res.status(500).send({ message: `Error while retrieving Property with id ${req.params.id}` });
        });
};

// Update a Property 
exports.update = (req, res) => {
    console.log("Updating Property " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "Property body cannot be empty" });
    }
    if (req.body.type) {
        this.validateType(req, res, req.body.type);
    }
    // Find Property and update it with the request body
    Property.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true })
        .then(Property => {
            if (!Property) {
                return res.status(404).send({ message: `Property not found with id ${req.params.id}` });
            }
            res.send(Property);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({ message: `Property not found with id ${req.params.id}` });
            }
            return res.status(500).send({ message: `Error updating Property with id ${req.params.id}` });
        });
};

// Deletes a Property with the specified BrandId in the request
exports.delete = (req, res) => {
    Property.findByIdAndRemove(req.params.id)
        .then(Property => {
            if (!Property) {
                return res.status(404).send({ message: `Property not found with id ${req.params.id}` });
            }
            res.send({ message: "Property deleted successfully!" });
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                return res.status(404).send({ message: `Property not found with id ${req.params.id}` });
            }
            return res.status(500).send({
                message: `Could not delete Property with id ${req.params.id}`
            });
        });
};

// Deletes a Property with the specified BrandId in the request
exports.deleteEverything = (req, res) => {
    Property.remove().then(result => {
        res.send({ message: "Deleted all Properties" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all Properties. ${err.message}`
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
    console.log(`Attempting to persist Property ` + JSON.stringify(property));
    // Save Property in the database
    property.save()
        .then(data => {
            console.log(`Persisted Property: ${data._id}`);
            res.status(201).send(data);
        }).catch(err => {
            console.error('Save failed. '+ err);
            res.status(500).send({ message: err.message || "Some error occurred while creating the Property." });
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
    var safeId = generateSafeId();
    return {
        title: data.title,
        pin: safeId,
        type: data.type,
        size: data.size,
        summary: data.summary,
        keyFeatures: data.keyFeatures,
        description: data.description,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        rental: data.rental,
        sale: data.sale,
        contact: data.contact,
        address: data.address,
        stations: data.stations,
        schools: data.schools,
        superStores: data.superStores,
        consumptionType: data.consumptionType,
        tags: data.tags,
        availableDate: data.availableDate || new Date(),
        addedDate: data.addedDate || new Date(),
        liveDate: data.liveDate || new Date(),
        coverPhoto: data.coverPhoto,
        status: data.status || 'Available',
        gallery: data.gallery,
        floorPlan: data.gallery,
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