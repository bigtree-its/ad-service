//Require CloudKitchen Model
const CloudKitchen = require('../../model/cloudkitchen/cloudkitchen');
const ImageUtils = require('../../utils/image-utils');
const Dish = require('../../model/cloudkitchen/dish');
const Cuisine = require('../../model/cloudkitchen/cuisine');
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');
//Require Generate Safe Id for Random unique id Generation
// var generateSafeId = require('generate-safe-id');
// Require Validation Utils
const { validationResult, errorFormatter } = require('../validation');
const Utils = require('../../utils/utils.js');

function isEmpty(data) {
    if (data === undefined || data === null || data.length === 0) {
        return true;
    }
    return false;
}

// Create and Save a new CloudKitchen
exports.create = async (req, res) => {

    console.log("Creating new CloudKitchen ");
    /** Check for validation errors */
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }

    /** Validate Cuisine */
    try {
        if (req.body.cuisines) {
            this.validateCuisine(req, res);
        }
    } catch (error) {
        console.log("Error: " + error);
        return res.status(400).send({ message: error });
    }

    /** Validate Dish */
    try {
        if (req.body.dishes) {
            this.validateDish(req, res);
        }
    } catch (error) {
        console.log("Error: " + error);
        return res.status(400).send({ message: error });
    }

    /** Validate PostcodeDistricts */
    // try {
    //     this.validatePostcodeDistricts(req, res, );
    // } catch (error) {
    //     console.log("Error: " + error);
    //     return res.status(400).send({ message: error });
    // }

    /** Validate Slot */
    // try {
    //     this.validateSlots(req, res, );
    // } catch (error) {
    //     console.log("Error: " + error);
    //     return res.status(400).send({ message: error });
    // }
    /** Persist */
    checkDuplicateAndPersist(req, res);
};

exports.validateCuisine = async (req, res) => {
    try {
        var cuisines = req.body.cuisines;
        console.log('Verifying Cuisine : ' + cuisines);
        var records = await Cuisine.find().where('_id').in(cuisines).exec();
        if (!records) {
            throw new Error(`Some or more cuisines : ${cuisines} not valid.`);
        }
        console.log("Verified Cuisines: " + records);
    } catch (error) {
        console.error(error);
        throw new Error(`Cannot verify Cuisines ${cuisines}`);
    }
};

exports.validateDish = async (req, res) => {
    try {
        var dishes = req.body.dishes;
        console.log('Verifying dishes : ' + dishes);
        var records = await Dish.find().where('_id').in(dishes).exec();
        if (!records) {
            throw new Error(`Some or more dishes in ${dishes} not valid.`);
        }
        console.log("Verified dishes: " + records);
    } catch (error) {
        console.error(error);
        throw new Error(`Cannot verify dishes ${req.body.dishes}`);
    }
};

exports.validatePostcodeDistricts = async (req, res) => {
    try {
        var serviceAreas = req.body.serviceAreas;
        if (isEmpty(serviceAreas)) {
            throw new Error(`ServiceAreas are Mandatory`);
        }
        console.log('Verifying ServiceArea  : ' + serviceAreas);
        var records = await PostcodeDistrict.find().where('_id').in(serviceAreas).exec();
        console.log("Verified serviceAreas: " + records);
        if (!records) {
            throw new Error(`serviceAreas : ${serviceAreas} not valid.`);
        }
    } catch (error) {
        console.error(error);
        throw new Error(`Cannot find service areas ${serviceAreas}`);
    }
};


exports.validateSlots = async (req, res) => {
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


async function checkDuplicateAndPersist(req, res) {
    console.log(`Checking if CloudKitchen already exist..`);
    var slug = getSlug(req.body.name, req.body.address.postcode);
    var _id = await CloudKitchen.exists({ slug: slug });
    if (_id) {
        console.log(`CloudKitchen already exist with name ${req.body.name}`);
        res
            .status(400)
            .send({ message: `CloudKitchen already exist with name ${req.body.name}` });
    } else {
        persist(req, res);
    }
}

exports.paginate = (req, res) => {
    req.query.page = req.query.page || 1;
    req.query.limit = req.query.limit || 25;
    const options = { page: req.query.page, limit: req.query.limit };
    let query = CloudKitchen.find();
    if (req.query.name) {
        query.where('name', { $regex: '.*' + req.query.name + '.*' })
    }
    if (req.query.email) {
        query.where('email', { $in: req.query.email })
    }
    if (req.query.postcode) {
        query.where('address.postcode', { $in: req.query.postcode })
    }
    CloudKitchen.aggregatePaginate(query, options, function (err, result) {
        if (result) {
            console.log(`Returning ${result.docs.length} CloudKitchens.`);
            res.send(result);
        } else if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving CloudKitchens."
            });
        }
    });
}

// Retrieve and return all CloudKitchens from the database.
exports.findAll = (req, res) => {
    console.log('Finding cloud kitchens..')
    let query = CloudKitchen.find();
    if (req.query.dishes) {
        query.where('dishes', { $in: req.query.dishes })
    }
    if (req.query.serviceAreas) {
        query.where('serviceAreas', { $in: req.query.serviceAreas })
    }
    if (req.query.cuisines) {
        query.where('cuisines', { $in: req.query.cuisines })
    }
    if (req.query.slots) {
        query.where('slots', { $in: req.query.slots })
    }
    if (req.query.slug) {
        query.where('slug', req.query.slug)
    }
    if (req.query.active) {
        query.where('active', req.query.active)
    } if (req.query.onOffer) {
        query.where('onOffer', req.query.onOffer)
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
        query.where('contact.email', req.query.email)
    }
    CloudKitchen.find(query)
        .populate("cuisines")
        .populate("dishes")
        .then(result => {
            console.log(`Returning ${result.length} CloudKitchens.`);
            res.send(result);
        }).catch(error => {
            console.log("Error while fetching from database. " + error.message);
            res.status(500).send({
                message: error.message || "Some error occurred while retrieving CloudKitchens."
            });
        });
};

// Find a single CloudKitchen with a BrandId
exports.findOne = (req, res) => {
    console.log(`Finding a cloud kitchen ${req.params.id}`);
    CloudKitchen.findById(req.params.id)
        .populate("cuisines")
        .populate("dishes")
        .then(data => {
            if (!data) {
                return res.status(404).send({ message: `CloudKitchen not found with id ${req.params.id}` });
            }
            res.send(data);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({ message: `CloudKitchen not found with id ${req.params.id}` });
            }
            return res.status(500).send({ message: `Error while retrieving CloudKitchen with id ${req.params.id}` });
        });
};

// Update a CloudKitchen 
exports.update = (req, res) => {
    console.log(`Updating CloudKitchen ${req.params.id}`);
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "CloudKitchen body cannot be empty" });
    }
    if (req.body.type) {
        this.validateType(req, res, req.body.type);
    }
    const filter = { _id: req.params.id };
    // Find CloudKitchen and update it with the request body
    CloudKitchen.findOneAndUpdate(filter, req.body)
        .populate("cuisines")
        .populate("serviceAreas")
        .populate("dishes")
        .then(CloudKitchen => {
            if (!CloudKitchen) {
                return res.status(404).send({ message: `CloudKitchen not found with id ${req.params.id}` });
            }
            res.send(CloudKitchen);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({ message: `CloudKitchen not found with id ${req.params.id}` });
            }
            return res.status(500).send({ message: `Error updating CloudKitchen with id ${req.params.id}` });
        });
};



// Deletes a CloudKitchen with the specified BrandId in the request
exports.delete = async (req, res) => {
    var ids = await CloudKitchen.find({ _id: req.params.id }, '_id');
    CloudKitchen.deleteOne({ _id: req.params.id })
        .then(result => {
            console.log('Deleted CloudKitchen ' + JSON.stringify(result));
            res.send({ message: "CloudKitchen deleted successfully!" });
            if (ids) {
                ImageUtils.deleteImages(ids)
            }
        }).catch(err => {
            console.error('Error while deleting cloud kitchen ' + JSON.stringify(err))
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                res.status(404).send({ message: `CloudKitchen not found with id ${req.params.id}` });
            } else {
                res.status(500).send({ message: `Could not delete CloudKitchen with id ${req.params.id}` });
            }
        });
};

// Deletes a CloudKitchen with the specified BrandId in the request
exports.deleteEverything = (req, res) => {
    CloudKitchen.deleteMany().then(result => {
        res.send({ message: "Deleted all CloudKitchens" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all CloudKitchens. ${err.message}`
        });
    });
};

/**
 * Persists new CloudKitchen Model 
 * 
 * @param {Request} req The HTTP Request 
 * @param {Response} res The HTTP Response
 */
function persist(req, res) {

    const localCloudKitchen = buildCloudKitchen(req);
    console.log(`Attempting to persist CloudKitchen ` + JSON.stringify(localCloudKitchen));
    // Save CloudKitchen in the database
    localCloudKitchen.save()
        .then(data => {
            console.log(`Persisted CloudKitchen: ${data._id}`);
            res.status(201).send(data);
        }).catch(err => {
            console.error('Save failed. ' + err);
            res.status(500).send({ message: err.message || "Some error occurred while creating the CloudKitchen." });
        });
}

/**
 * Builds CloudKitchen from incoming Request.
 * @returns CloudKitchen Model
 * @param {Request} req 
 */
function buildCloudKitchen(req) {
    return new CloudKitchen(buildCloudKitchenJson(req));
}

/**
 * Builds CloudKitchen JSON incoming Request.
 * 
 * @returns {String} CloudKitchen JSON
 * @param {Request} req 
 */
function buildCloudKitchenJson(req) {
    var data = req.body;
    var slug = "";
    var safeId = Utils.randomString(9).toLowerCase();
    if (data.name) {
        slug = getSlug(data.name, safeId);
    }
    return {
        name: data.name,
        image: data.image,
        description: data.description,
        partyDescription: data.partyDescription,
        allergenAdvice: data.allergenAdvice,
        collectionTimings: data.collectionTimings,
        slug: slug,
        serviceAreas: data.serviceAreas,
        keywords: data.keywords,
        cuisines: data.cuisines,
        dishes: data.dishes,
        contact: data.contact,
        address: data.address,
        rating: data.rating,
        reviews: data.reviews,
        active: data.active,
        onOffer: data.active,
        offerPrice: data.active,
        partyOrderLeadDays: data.partyOrderLeadDays,
        doDelivery: data.doDelivery,
        deliveryFee: data.deliveryFee,
        freeDeliveryOver: data.freeDeliveryOver,
        packagingFee: data.packagingFee,
        minimumOrder: data.minimumOrder,
        minimumPartyOrder: data.minimumPartyOrder,
        doPartyOrders: data.doPartyOrders,
        preOrderOnly: data.preOrderOnly,
        open: data.open,
    };
}
/**
 * Returns the slog from the given name
 * e.g if name = M & S Foods then Slug = m-s-foods
 * Replaces special characters and replace space with -
 * 
 * @param {String} name 
 */
function getSlug(name, postcode) {
    return name.trim().replace(/[\W_]+/g, "-").toLowerCase() + "-" + postcode.trim().replace(/[\W_]+/g, "-").toLowerCase()
}