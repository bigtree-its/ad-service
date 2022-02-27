const PropertyType = require('../../model/property/type');
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');

// Require Validation Utils
const { validationResult, errorFormatter } = require('../validation');

// Create and Save a new PropertyType
exports.create = (req, res) => {
    console.log("Creating new PropertyType " + JSON.stringify(req.body));
    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    console.log(`Finding if a PropertyType already exist with name ${req.body.name}`);
    PropertyType.exists({ name: req.body.name }, function(err, result) {
        if (err) {
            return res.status(500).send({ message: `Error while finding PropertyType with name ${req.body.name}` });
        } else if (result) {
            console.log(`PropertyType already exist with name ${req.body.name}`);
            res.status(400).send({ message: `PropertyType already exist with name ${req.body.name}` });
        } else {
            persist(req, res);
        }
    });

};


// Retrieve and return all Brands from the database.
exports.findAll = (req, res) => {
    console.log("Received request to get all property types");
    PropertyType.find()
        .then(data => {
            if (data) {
                console.log("Returning " + data.length + " PropertyTypes.");
                res.send(data);
            } else {
                console.log("Returning no PropertyTypes ");
                res.send({});
            }
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving PropertyTypes."
            });
        });
};

// Find a single PropertyType with a BrandId
exports.findOne = (req, res) => {
    console.log("Received request get a property type with id " + req.params.id);
    PropertyType.findById(req.params.id)
        .then(PropertyType => {
            if (!PropertyType) {
                return PropertyTypeNotFoundWithId(req, res);
            }
            res.send(PropertyType);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return PropertyTypeNotFoundWithId(req, res);
            }
            return res.status(500).send({ message: "Error while retrieving PropertyType with id " + req.params.id });
        });
};

// Update a PropertyType identified by the BrandId in the request
exports.update = (req, res) => {
    console.log("Updating PropertyType " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "PropertyType body can not be empty" });
    }
    // Find PropertyType and update it with the request body
    PropertyType.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        .then(PropertyType => {
            if (!PropertyType) {
                return PropertyTypeNotFoundWithId(req, res);
            }
            res.send(PropertyType);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return PropertyTypeNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Error updating PropertyType with id " + req.params.id
            });
        });
};

// Delete a PropertyType with the specified BrandId in the request
exports.delete = (req, res) => {
    PropertyType.findByIdAndRemove(req.params.id)
        .then(PropertyType => {
            if (!PropertyType) {
                return PropertyTypeNotFoundWithId(req, res);
            }
            res.send({ message: "PropertyType deleted successfully!" });
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                return PropertyTypeNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Could not delete PropertyType with id " + req.params.id
            });
        });
};

exports.deleteAll = (req, res) => {
    
    PropertyType.remove().then(result => {
        res.send({ message: "Deleted all property types" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete property types. ${err.message}`
        });
    });
}

/**
 * Persists new PropertyType document
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function persist(req, res) {
    const PropertyType = buildBrandObject(req);
    // Save PropertyType in the database
    PropertyType.save()
        .then(data => {
            res.status(201).send(data);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the PropertyType."
            });
        });
}

/**
 * Sends 404 HTTP Response with Message
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function PropertyTypeNotFoundWithId(req, res) {
    res.status(404).send({ message: `PropertyType not found with id ${req.params.id}` });
}

/**
 * Builds PropertyType object from Request
 * 
 * @param {Request} req 
 */
function buildBrandObject(req) {
    return new PropertyType(buildBrandJson(req));
}

/**
 * Builds PropertyType Json from Request
 * 
 * @param {Request} req 
 */
function buildBrandJson(req) {
    return {
        name: req.body.name,
        slug: req.body.slug || req.body.name.trim().replace(/[\W_]+/g, "-").toLowerCase(),
        logo: req.body.logo,
        manufacturer: req.body.manufacturer,
        exporter: req.body.exporter,
        importer: req.body.importer
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