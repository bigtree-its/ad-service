const PostcodeDistrict = require('../../model/common/postcodedistrict');
const PostcodeArea = require('../../model/common/postcodearea');

//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');

// Require Validation Utils
const { validationResult, errorFormatter } = require('../validation');

// Create and Save a new PostcodeDistrict
exports.create = (req, res) => {
    console.log("Creating new PostcodeDistrict " + JSON.stringify(req.body));
    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    /** Validate Area */
    var error = this.validateArea(req, res);
    if (error) {
        console.error(error);
        return res.status(400).send(Utils.buildError(error));
    }
    
    var slug = getSlug(req.body.prefix, req.body.area);
    console.log(`Finding if a PostcodeDistrict already exist for: ${slug}`);

    PostcodeDistrict.exists({ slug: slug }, function (err, result) {
        if (err) {
            return res.status(500).send({ message: `Error while finding PostcodeDistrict for: ${slug}` });
        } else if (result) {
            console.log(`PostcodeDistrict already exist for: ${slug}`);
            res.status(400).send({ message: `PostcodeDistrict already exist for: ${slug}` });
        } else {
            persist(req, res);
        }
    });

};

exports.validateArea = async (req, res) => {
    try {
        var area = req.body.area;
        if (!area) {
            return `Area is Mandatory`;
        }
        var records = await PostcodeArea.findOne({ _id: area }).exec();
        if (!records) {
            return `Some or more cuisines : ${area} not valid.`;
        }
    } catch (error) {
        return `Cannot find Postcode area ${area}`;
    }
};

// Retrieve and return all PostcodeDistrict from the database.
exports.lookup = (req, res) => {
    let query = PostcodeDistrict.find();
    if (req.query.area) {
        query.where('area', req.query.area);
    }
    if (req.query.prefix) {
        // query.where('prefix', req.query.prefix);
        query.where({ 'prefix': { '$regex': req.query.prefix, $options: 'i' } });
    }
    if (req.query.region) {
        query.where('region', req.query.region);
    }
    if (req.query.postTown) {
        query.where('postTown', req.query.postTown);
    }
    query.where({ active: true });
    PostcodeDistrict.find(query).then(result => {
        console.log(`Returning ${result.length} PostcodeDistricts.`);
        res.send(result);
    }).catch(error => {
        console.log("Error while fetching PostcodeDistrict from database. " + error.message);
        res.status(500).send({
            message: error.message || "Some error occurred while retrieving PostcodeDistrict."
        });
    });
};


// Deletes all
exports.deleteEverything = (req, res) => {
    PostcodeDistrict.remove().then(result => {
        res.send({ message: "Deleted all PostcodeDistricts" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all PostcodeDistricts. ${err.message}`
        });
    });
};

// Find a single PostcodeDistrict with a MenuId
exports.findOne = (req, res) => {
    console.log("Received request get a PostcodeDistrict with id " + req.params.id);
    PostcodeDistrict.findOne({ _id: req.params.id })
        .then(sd => {
            if (!sd) {
                return notFound(req, res);
            }
            res.send(sd);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return notFound(req, res);
            }
            return res.status(500).send({ message: "Error while retrieving PostcodeDistrict with id " + req.params.id });
        });
};

// Update a PostcodeDistrict identified by the MenuId in the request
exports.update = (req, res) => {
    console.log("Updating PostcodeDistrict " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "PostcodeDistrict body can not be empty" });
    }
    // Find PostcodeDistrict and update it with the request body
    PostcodeDistrict.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        .then(sd => {
            if (!sd) {
                return notFound(req, res);
            }
            res.send(sd);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return notFound(req, res);
            }
            return res.status(500).send({
                message: "Error updating PostcodeDistrict with id " + req.params.id
            });
        });
};

// Delete a PostcodeDistrict with the specified MenuId in the request
exports.delete = (req, res) => {
    PostcodeDistrict.findByIdAndRemove(req.params.id)
        .then(sd => {
            if (!sd) {
                return notFound(req, res);
            }
            res.send({ message: "PostcodeDistrict deleted successfully!" });
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.prefix === 'NotFound') {
                return notFound(req, res);
            }
            return res.status(500).send({
                message: "Could not delete PostcodeDistrict with id " + req.params.id
            });
        });
};

/**
 * Persists new PostcodeDistrict document
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function persist(req, res) {
    const PostcodeDistrict = buildPostcodeDistrictObject(req);
    // Save PostcodeDistrict in the database
    PostcodeDistrict.save()
        .then(data => {
            res.status(201).send(data);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the PostcodeDistrict."
            });
        });
}

/**
 * Sends 404 HTTP Response with Message
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function notFound(req, res) {
    res.status(404).send({ message: `PostcodeDistrict not found with id ${req.params.id}` });
}

/**
 * Builds PostcodeDistrict object from Request
 * 
 * @param {Request} req 
 */
function buildPostcodeDistrictObject(req) {
    return new PostcodeDistrict(buildPostcodeDistrictJson(req));
}

/**
 * Builds PostcodeDistrict Json from Request
 * 
 * @param {Request} req 
 */
function buildPostcodeDistrictJson(req) {
    return {
        active: true,
        prefix: req.body.prefix,
        area: req.body.area,
        region: req.body.region,
        postTown: req.body.postTown,
        slug: req.body.slug || getSlug(req.body.prefix, req.body.area)
    };
}

/**
 * Returns the slug from the given prefix
 * e.g if prefix = M & S PostcodeDistricts then Slug = m-s-PostcodeDistricts
 * Replaces special characters and replace space with -
 * 
 * @param {String} prefix 
 */
function getSlug(prefix, area) {
    return prefix.trim().replace(/[\W_]+/g, "-").toLowerCase() + "-" + area.trim().replace(/[\W_]+/g, "_").toLowerCase()
}