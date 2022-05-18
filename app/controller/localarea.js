const LocalArea = require('../model/localchef/localarea');
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');

// Require Validation Utils
const { validationResult, errorFormatter } = require('./validation');

// Create and Save a new LocalArea
exports.create = (req, res) => {
    console.log("Creating new localarea " + JSON.stringify(req.body));
    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    var slug = getSlug(req.body.name, req.body.city);
    console.log(`Finding if a localarea already exist for: ${slug}`);

    LocalArea.exists({ slug: slug }, function (err, result) {
        if (err) {
            return res.status(500).send({ message: `Error while finding LocalArea for: ${slug}` });
        } else if (result) {
            console.log(`LocalArea already exist for: ${slug}`);
            res.status(400).send({ message: `LocalArea already exist for: ${slug}` });
        } else {
            persist(req, res);
        }
    });

};

// Retrieve and return all local area from the database.
exports.lookup = (req, res) => {
    if (req.query.slug) {
        return findOneBySlug(req, res);
    } else {
        let query = LocalArea.find();
        if (req.query.text) {
            // query.where('name', { $regex: '.*' + req.query.name + '.*' })
            query.where({ slug: { '$regex': '.*' + req.query.text + '.*', '$options': 'i' } })
        }
        if (req.query.city) {
            // query.where('name', { $regex: '.*' + req.query.name + '.*' })
            query.where({ city: { '$regex': '.*' + req.query.city + '.*', '$options': 'i' } })
        }
        LocalArea.find(query).then(result => {
            console.log(`Returning ${result.length} local area.`);
            res.send(result);
        }).catch(error => {
            console.log("Error while fetching from database. " + error.message);
            res.status(500).send({
                message: error.message || "Some error occurred while retrieving local area."
            });
        });
    }

};

function findOneBySlug(req, res) {
    console.log('Fetching a local area with slug: '+ req.query.slug);
    LocalArea.findOne({ slug: req.query.slug })
        .then(localarea => {
            if (!localarea) {
                return localareaNotFoundWithId(req, res);
            }
            res.send(localarea);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return localareaNotFoundWithId(req, res);
            }
            return res.status(500).send({ message: "Error while retrieving LocalArea with id " + req.params.id });
        });
}

// Retrieve and return all LocalAreas from the database.
exports.findAll = (req, res) => {
    console.log("Received request to get all localareas");
    if (req.query.text) {
        return this.lookup(req, res);
    } else {
        LocalArea.find()
            .then(data => {
                if (data) {
                    console.log("Returning " + data.length + " localareas.");
                    res.send(data);
                } else {
                    console.log("Returning no localareas ");
                    res.send({});
                }
            })
            .catch(err => {
                res.status(500).send({
                    message: err.message || "Some error occurred while retrieving localareas."
                });
            });
    }

};

// Deletes all
exports.deleteEverything = (req, res) => {
    LocalArea.remove().then(result => {
        res.send({ message: "Deleted all localareas" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all localareas. ${err.message}`
        });
    });
};

// Find a single LocalArea with a LocalAreaId
exports.findOne = (req, res) => {
    console.log("Received request get a localarea with id " + req.params.id);
    LocalArea.findOne({ _id: req.params.id })
        .then(localarea => {
            if (!localarea) {
                return localareaNotFoundWithId(req, res);
            }
            res.send(localarea);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return localareaNotFoundWithId(req, res);
            }
            return res.status(500).send({ message: "Error while retrieving LocalArea with id " + req.params.id });
        });
};

// Update a LocalArea identified by the LocalAreaId in the request
exports.update = (req, res) => {
    console.log("Updating localarea " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "LocalArea body can not be empty" });
    }
    // Find LocalArea and update it with the request body
    LocalArea.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        .then(localarea => {
            if (!localarea) {
                return localareaNotFoundWithId(req, res);
            }
            res.send(localarea);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return localareaNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Error updating LocalArea with id " + req.params.id
            });
        });
};

// Delete a LocalArea with the specified LocalAreaId in the request
exports.delete = (req, res) => {
    LocalArea.findByIdAndRemove(req.params.id)
        .then(localarea => {
            if (!localarea) {
                return localareaNotFoundWithId(req, res);
            }
            res.send({ message: "LocalArea deleted successfully!" });
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                return localareaNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Could not delete LocalArea with id " + req.params.id
            });
        });
};

/**
 * Persists new LocalArea document
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function persist(req, res) {
    const localarea = buildLocalAreaObject(req);
    // Save LocalArea in the database
    localarea.save()
        .then(data => {
            res.status(201).send(data);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the LocalArea."
            });
        });
}

/**
 * Sends 404 HTTP Response with Message
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function localareaNotFoundWithId(req, res) {
    res.status(404).send({ message: `LocalArea not found with id ${req.params.id}` });
}

/**
 * Builds LocalArea object from Request
 * 
 * @param {Request} req 
 */
function buildLocalAreaObject(req) {
    return new LocalArea(buildLocalAreaJson(req));
}

/**
 * Builds LocalArea Json from Request
 * 
 * @param {Request} req 
 */
function buildLocalAreaJson(req) {
    return {
        name: req.body.name,
        city: req.body.city,
        country: req.body.country,
        slug: req.body.slug || getSlug(req.body.name, req.body.city)
    };
}

/**
 * Returns the slug from the given name
 * e.g if name = M & S Foods then Slug = m-s-foods
 * Replaces special characters and replace space with -
 * 
 * @param {String} name 
 */
function getSlug(name, city) {
    return name.trim().replace(/[\W_]+/g, "-").toLowerCase() + "-" + city.trim().replace(/[\W_]+/g, "-").toLowerCase()
}