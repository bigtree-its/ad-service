//Require LocalChef Model
const LocalChef = require('../model/localchef/localchef');
const Cuisine = require('../model/localchef/cuisine');
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');
//Require Generate Safe Id for Random unique id Generation
var generateSafeId = require('generate-safe-id');
// Require Validation Utils
const { validationResult, errorFormatter } = require('./validation');
const LocalArea = require('../model/localchef/localarea');

function isEmpty(data){
    if ( data === undefined || data === null || data.length === 0){
        return true;
    }
    return false;
}

// Create and Save a new LocalChef
exports.create = async(req, res) => {

    console.log("Creating new LocalChef " + JSON.stringify(req.body));
    /** Check for validation errors */
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }

    /** Validate Cuisine */
    try{
        this.validateCuisine(req, res, );
    } catch (error) {
        console.log("Error: " + error);
        return res.status(400).send({ message: error });
    }

    /** Validate ServiceAreas */
    try{
        this.validateServiceAreas(req, res, );
    } catch (error) {
        console.log("Error: " + error);
        return res.status(400).send({ message: error });
    }

    /** Validate Slot */
    try{
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
        if ( isEmpty(cuisines)){
            throw new Error(`Cusines are Mandatory`);
        }
        console.log('Verifying Cuisine : '+ cuisines);
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
        if ( isEmpty(serviceAreas)){
            throw new Error(`Service Areas are Mandatory`);
        }
        console.log('Verifying Cuisine : '+ serviceAreas);
        var records = await LocalArea.find().where('_id').in(serviceAreas).exec();
        console.log("Verified serviceAreas: " + records);
        if (!records) {
            throw new Error(`LocalArea : ${serviceAreas} not valid.`);
        }
    } catch (error) {
        console.error(error);
        throw new Error(`Cannot find LocalArea ${serviceAreas}`);
    }
};


exports.validateSlots = async(req, res) => {
    var types = ['Breakfast', 'Lunch', 'Dinner', 'AllDay'];
    var valid = false;
    var slots = req.body.slots;
    if ( slots){
        var length = types.length;
        while(length--) {
            if (slots.indexOf(types[length]) != -1) {
                valid = true;
            }
         }
    }
    if ( valid === false){
        console.log(`Invalid Slots ${slots}`);
        return res.status(400).send({ message: `Invalid Slots ${slots}`});
    }
}


function checkDuplicateAndPersist(req, res) {
    console.log(`Checking if LocalChef already exist..`);
    LocalChef.exists({ name: req.body.name, postcode: req.body.address.postcode }, function(err, result) {
        if (err) {
            return res.status(500).send({ message: `Error while finding LocalChef with postcode ${req.body.address.postcode}` });
        } else if (result) {
            console.log(`LocalChef already exist`);
            res.status(400).send({ message: `LocalChef already exist.` });
        } else {
            persist(req, res);
        }
    });
}

exports.paginate = (req, res) => {
    req.query.page = req.query.page || 1;
    req.query.limit = req.query.limit || 25;
    const options = { page: req.query.page, limit: req.query.limit };
    let query = LocalChef.find();
    if (req.query.name) {
        query.where('name', { $regex: '.*' + req.query.name + '.*' })
    }
    if (req.query.postcode) {
        query.where('address.postcode', { $in: req.query.postcode })
    }
    LocalChef.aggregatePaginate(query, options, function(err, result) {
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

// Retrieve and return all LocalChefs from the database.
exports.findAll = (req, res) => {
    console.log('Finding localchefs..')
    let query = LocalChef.find();
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
    if (req.query.noMinimumOrder) {
        query.where('noMinimumOrder', true);
    }
    LocalChef.find(query).populate("cuisines", "name").populate("serviceAreas").then(result => {
        console.log(`Returning ${result.length} LocalChefs.`);
        res.send(result);
    }).catch(error => {
        console.log("Error while fetching from database. " + error.message);
        res.status(500).send({
            message: error.message || "Some error occurred while retrieving LocalChefs."
        });
    });
};

// Find a single LocalChef with a BrandId
exports.findOne = (req, res) => {
    LocalChef.findById(req.params.id).populate("cuisines", "name").populate("serviceAreas")
        .then(LocalChef => {
            if (!LocalChef) {
                return res.status(404).send({ message: `LocalChef not found with id ${req.params.id}` });
            }
            res.send(LocalChef);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({ message: `LocalChef not found with id ${req.params.id}` });
            }
            return res.status(500).send({ message: `Error while retrieving LocalChef with id ${req.params.id}` });
        });
};

// Update a LocalChef 
exports.update = (req, res) => {
    console.log("Updating LocalChef " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "LocalChef body cannot be empty" });
    }
    if (req.body.type) {
        this.validateType(req, res, req.body.type);
    }
    // Find LocalChef and update it with the request body
    LocalChef.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true })
        .then(LocalChef => {
            if (!LocalChef) {
                return res.status(404).send({ message: `LocalChef not found with id ${req.params.id}` });
            }
            res.send(LocalChef);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({ message: `LocalChef not found with id ${req.params.id}` });
            }
            return res.status(500).send({ message: `Error updating LocalChef with id ${req.params.id}` });
        });
};

// Deletes a LocalChef with the specified BrandId in the request
exports.delete = (req, res) => {
    LocalChef.findByIdAndRemove(req.params.id)
        .then(LocalChef => {
            if (!LocalChef) {
                return res.status(404).send({ message: `LocalChef not found with id ${req.params.id}` });
            }
            res.send({ message: "LocalChef deleted successfully!" });
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                return res.status(404).send({ message: `LocalChef not found with id ${req.params.id}` });
            }
            return res.status(500).send({
                message: `Could not delete LocalChef with id ${req.params.id}`
            });
        });
};

// Deletes a LocalChef with the specified BrandId in the request
exports.deleteEverything = (req, res) => {
    LocalChef.remove().then(result => {
        res.send({ message: "Deleted all LocalChefs" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all LocalChefs. ${err.message}`
        });
    });
};

/**
 * Persists new LocalChef Model 
 * 
 * @param {Request} req The HTTP Request 
 * @param {Response} res The HTTP Response
 */
function persist(req, res) {
    
    const localChef = buildLocalChef(req);
    console.log(`Attempting to persist LocalChef ` + JSON.stringify(localChef));
    // Save LocalChef in the database
    localChef.save()
        .then(data => {
            console.log(`Persisted LocalChef: ${data._id}`);
            res.status(201).send(data);
        }).catch(err => {
            console.error('Save failed. '+ err);
            res.status(500).send({ message: err.message || "Some error occurred while creating the LocalChef." });
        });
}

/**
 * Builds LocalChef from incoming Request.
 * @returns LocalChef Model
 * @param {Request} req 
 */
function buildLocalChef(req) {
    return new LocalChef(buildLocalChefJson(req));
}

/**
 * Builds LocalChef JSON incoming Request.
 * 
 * @returns {String} LocalChef JSON
 * @param {Request} req 
 */
function buildLocalChefJson(req) {
    var data = req.body;
    var safeId = generateSafeId();
    var slug = "";
    if ( data.displayName){
        slug = getSlag(data.displayName);
    }else{
        slug = getSlag(data.name);
    }
    return {
        name: data.name,
        displayName: data.displayName,
        consumptionTypes: data.consumptionTypes,
        description: data.description,
        specials: data.specials,
        slug: slug,
        slots: data.slots,
        serviceAreas: data.serviceAreas,
        categories: data.categories,
        cuisines: data.cuisines,
        contact: data.contact,
        address: data.address,
        rating: data.rating,
        reviews: data.reviews,
        coverPhoto: data.coverPhoto,
        status: data.status || 'Open',
        gallery: data.gallery,
        active: data.active,
        preOrder: data.preOrder,
        delivery: data.delivery,
        takingOrdersNow: data.takingOrdersNow,
        collectionOnly: data.collectionOnly,
        minimumOrder: data.minimumOrder,
        deliveryFee: data.deliveryFee,
        packagingFee: data.packagingFee,
        minimumOrder: data.minimumOrder,
        collectionPolicy: data.collectionPolicy,
        deliveryPolicy: data.deliveryPolicy,
        noMinimumOrder: data.noMinimumOrder,
        preOrder: data.preOrder,
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