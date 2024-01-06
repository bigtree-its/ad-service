//Require Chef Model
const Chef = require('../model/chef/chef');
const Cuisine = require('../model/chef/cuisine');
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');
//Require Generate Safe Id for Random unique id Generation
var generateSafeId = require('generate-safe-id');
// Require Validation Utils
const { validationResult, errorFormatter } = require('./validation');
const LocalArea = require('../model/chef/servicearea');

function isEmpty(data) {
    if (data === undefined || data === null || data.length === 0) {
        return true;
    }
    return false;
}

// Create and Save a new Chef
exports.create = async(req, res) => {

    console.log("Creating new Chef ");
    /** Check for validation errors */
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }

    /** Validate Cuisine */
    try {
        this.validateCuisine(req, res, );
    } catch (error) {
        console.log("Error: " + error);
        return res.status(400).send({ message: error });
    }

    /** Validate ServiceAreas */
    try {
        this.validateServiceAreas(req, res, );
    } catch (error) {
        console.log("Error: " + error);
        return res.status(400).send({ message: error });
    }

    /** Validate Slot */
    try {
        this.validateSlots(req, res, );
    } catch (error) {
        console.log("Error: " + error);
        return res.status(400).send({ message: error });
    }
    /** Persist */
    checkDuplicateAndPersist(req, res);
};

exports.validateCuisine = async(req, res) => {
    try {
        var cuisines = req.body.cuisines;
        if (isEmpty(cuisines)) {
            throw new Error(`Cuisines are Mandatory`);
        }
        console.log('Verifying Cuisine : ' + cuisines);
        var records = await Cuisine.find().where('_id').in(cuisines).exec();
        console.log("Verified Cuisines: " + records);
        if (!records) {
            throw new Error(`Cuisine : ${cuisines} not valid.`);
        }
    } catch (error) {
        console.error(error);
        throw new Error(`Cannot find Cuisine ${cuisines}`);
    }
};

exports.validateServiceAreas = async(req, res) => {
    try {
        var serviceAreas = req.body.serviceAreas;
        if (isEmpty(serviceAreas)) {
            throw new Error(`Service Areas are Mandatory`);
        }
        console.log('Verifying Service Area : ' + serviceAreas);
        var records = await LocalArea.find().where('_id').in(serviceAreas).exec();
        console.log("Verified serviceAreas: " + records);
        if (!records) {
            throw new Error(`Service Area : ${serviceAreas} not valid.`);
        }
    } catch (error) {
        console.error(error);
        throw new Error(`Cannot find Service Area ${serviceAreas}`);
    }
};


exports.validateSlots = async(req, res) => {
    var types = ['Breakfast', 'Lunch', 'Dinner', 'AllDay'];
    var valid = false;
    var slots = req.body.slots;
    if (slots) {
        var length = types.length;
        while (length--) {
            if (slots.indexOf(types[length]) != -1) {
                valid = true;
            }
        }
    }
    if (valid === false) {
        console.log(`Invalid Slots ${slots}`);
        return res.status(400).send({ message: `Invalid Slots ${slots}` });
    }
}


function checkDuplicateAndPersist(req, res) {
    console.log(`Checking if Chef already exist..`);
    Chef.exists({ name: req.body.name, email: req.body.email }, function(err, result) {
        if (err) {
            return res.status(500).send({ message: `Error while finding Chef with email ${req.body.email}` });
        } else if (result) {
            console.log(`Chef already exist`);
            return res;
            // return res.status(400).send({ message: `Chef already exist.` });
        } else {
            persist(req, res);
        }
    });
}

exports.paginate = (req, res) => {
    req.query.page = req.query.page || 1;
    req.query.limit = req.query.limit || 25;
    const options = { page: req.query.page, limit: req.query.limit };
    let query = Chef.find();
    if (req.query.name) {
        query.where('name', { $regex: '.*' + req.query.name + '.*' })
    }
    if (req.query.email) {
        query.where('email', { $in: req.query.email })
    }
    if (req.query.postcode) {
        query.where('address.postcode', { $in: req.query.postcode })
    }
    Chef.aggregatePaginate(query, options, function(err, result) {
        if (result) {
            console.log(`Returning ${result.docs.length} Chefs.`);
            res.send(result);
        } else if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving Chefs."
            });
        }
    });
}

// Retrieve and return all Chefs from the database.
exports.findAll = (req, res) => {
    console.log('Finding chefs..')
    let query = Chef.find();
    if (req.query.serviceAreas) {
        query.where('serviceAreas', { $in: req.query.serviceAreas })
            // query.where('serviceAreas.slug', req.query.serviceArea);
            // query.where('serviceAreas', { 'slug': req.query.serviceArea });
            // query.where('serviceAreas', { $elemMatch: { 'slug': req.query.serviceArea } });
    }
    if (req.query.cuisines) {
        query.where('cuisines', { $in: req.query.cuisines })
    }
    if (req.query.slots) {
        this.validateSlots(req, res);
        query.where('slots', { $in: req.query.slots })
    }
    if (req.query.active) {
        query.where('active', req.query.active)
    }
    if (req.query.delivery) {
        query.where('delivery', true);
    }
    if (req.query.keywords) {
        query.where('keywords', { $in: req.query.keywords })
    }
    if (req.query.noMinimumOrder) {
        query.where('noMinimumOrder', true);
    }
    if (req.query.email) {
        query.where('email', req.query.email)
    }
    Chef.find(query)
        .populate("cuisines")
        .populate("serviceAreas")
        .populate("slots")
        .then(result => {
            console.log(`Returning ${result.length} Chefs.`);
            res.send(result);
        }).catch(error => {
            console.log("Error while fetching from database. " + error.message);
            res.status(500).send({
                message: error.message || "Some error occurred while retrieving Chefs."
            });
        });
};

// Find a single Chef with a BrandId
exports.findOne = (req, res) => {
    console.log(`Finding a chef ${req.params.id}`);
    Chef.findById(req.params.id).populate("cuisines").populate("serviceAreas").populate("slots")
        .then(data => {
            if (!data) {
                return res.status(404).send({ message: `Chef not found with id ${req.params.id}` });
            }
            res.send(data);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({ message: `Chef not found with id ${req.params.id}` });
            }
            return res.status(500).send({ message: `Error while retrieving Chef with id ${req.params.id}` });
        });
};

// Update a Chef 
exports.update = (req, res) => {
    console.log(`Updating Chef ${req.params.id}`);
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "Chef body cannot be empty" });
    }
    if (req.body.type) {
        this.validateType(req, res, req.body.type);
    }
    // Find Chef and update it with the request body
    Chef.findByIdAndUpdate({ _id: req.params.id }, req.body, { upsert: true, setDefaultsOnInsert: true, new: true })
        .populate("cuisines")
        .populate("serviceAreas")
        .populate("slots")
        .then(Chef => {
            if (!Chef) {
                return res.status(404).send({ message: `Chef not found with id ${req.params.id}` });
            }
            res.send(Chef);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({ message: `Chef not found with id ${req.params.id}` });
            }
            return res.status(500).send({ message: `Error updating Chef with id ${req.params.id}` });
        });
};

// Deletes a Chef with the specified BrandId in the request
exports.delete = (req, res) => {
    Chef.findByIdAndRemove(req.params.id)
        .then(Chef => {
            if (!Chef) {
                return res.status(404).send({ message: `Chef not found with id ${req.params.id}` });
            }
            res.send({ message: "Chef deleted successfully!" });
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                return res.status(404).send({ message: `Chef not found with id ${req.params.id}` });
            }
            return res.status(500).send({
                message: `Could not delete Chef with id ${req.params.id}`
            });
        });
};

// Deletes a Chef with the specified BrandId in the request
exports.deleteEverything = (req, res) => {
    Chef.remove().then(result => {
        res.send({ message: "Deleted all Chefs" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all Chefs. ${err.message}`
        });
    });
};

/**
 * Persists new Chef Model 
 * 
 * @param {Request} req The HTTP Request 
 * @param {Response} res The HTTP Response
 */
function persist(req, res) {

    const localChef = buildChef(req);
    console.log(`Attempting to persist Chef ` + JSON.stringify(localChef));
    // Save Chef in the database
    localChef.save()
        .then(data => {
            console.log(`Persisted Chef: ${data._id}`);
            res.status(201).send(data);
        }).catch(err => {
            console.error('Save failed. ' + err);
            res.status(500).send({ message: err.message || "Some error occurred while creating the Chef." });
        });
}

/**
 * Builds Chef from incoming Request.
 * @returns Chef Model
 * @param {Request} req 
 */
function buildChef(req) {
    return new Chef(buildChefJson(req));
}

/**
 * Builds Chef JSON incoming Request.
 * 
 * @returns {String} Chef JSON
 * @param {Request} req 
 */
function buildChefJson(req) {
    var data = req.body;
    var safeId = generateSafeId();
    var slug = "";
    if (data.kitchenName) {
        slug = getSlug(data.kitchenName);
    } else {
        slug = getSlug(data.name);
    }
    return {
        name: data.name,
        kitchenName: data.kitchenName,
        consumptionTypes: data.consumptionTypes,
        description: data.description,
        specials: data.specials,
        slug: slug,
        slots: data.slots,
        serviceAreas: data.serviceAreas,
        categories: data.categories,
        keywords: data.keywords,
        cuisines: data.cuisines,
        contact: data.contact,
        address: data.address,
        rating: data.rating,
        email: data.email,
        reviews: data.reviews,
        coverPhoto: data.coverPhoto,
        status: data.status || 'Open',
        gallery: data.gallery,
        active: data.active,
        doDelivery: data.doDelivery,
        deliveryDistance: data.deliveryDistance,
        deliveryMinimum: data.deliveryMinimum,
        deliveryFee: data.deliveryFee,
        freeDeliveryOver: data.freeDeliveryOver,
        packagingFee: data.packagingFee,
        minimumOrder: data.minimumOrder,
        minimumPartyOrder: data.minimumPartyOrder,
        doPartyOrders: data.doPartyOrders,
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