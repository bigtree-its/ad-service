const PostcodeArea = require('../../model/common/postcodearea');

//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');

// Require Validation Utils
const { validationResult, errorFormatter } = require('../validation');

// Create and Save a new PostcodeArea
exports.create = (req, res) => {
    console.log("Creating new PostcodeArea " + JSON.stringify(req.body));
    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    var slug = getSlug(req.body.prefix, req.body.area);
    console.log(`Finding if a PostcodeArea already exist for: ${slug}`);

    PostcodeArea.exists({ slug: slug }, function (err, result) {
        if (err) {
            return res.status(500).send({ message: `Error while finding PostcodeArea for: ${slug}` });
        } else if (result) {
            console.log(`PostcodeArea already exist for: ${slug}`);
            res.status(400).send({ message: `PostcodeArea already exist for: ${slug}` });
        } else {
            persist(req, res);
        }
    });

};


// Retrieve and return all PostcodeArea from the database.
exports.lookup = (req, res) => {
    let query = PostcodeArea.find();
    if (req.query.prefix) {
        query.where({ 'prefix': { '$regex': req.query.prefix, $options: 'i' } });
    }
    if (req.query.name) {
        query.where('name', req.query.name);
    }
    query.where({ active: true });
    PostcodeArea.find(query).then(result => {
        console.log(`Returning ${result.length} PostcodeAreas.`);
        res.send(result);
    }).catch(error => {
        console.log("Error while fetching PostcodeArea from database. " + error.message);
        res.status(500).send({
            message: error.message || "Some error occurred while retrieving PostcodeArea."
        });
    });
};


// Deletes all
exports.deleteEverything = (req, res) => {
    PostcodeArea.remove().then(result => {
        res.send({ message: "Deleted all PostcodeAreas" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all PostcodeAreas. ${err.message}`
        });
    });
};

// Find a single PostcodeArea with a MenuId
exports.findOne = (req, res) => {
    console.log("Received request get a PostcodeArea with id " + req.params.id);
    PostcodeArea.findOne({ _id: req.params.id })
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
            return res.status(500).send({ message: "Error while retrieving PostcodeArea with id " + req.params.id });
        });
};

// Update a PostcodeArea identified by the MenuId in the request
exports.update = (req, res) => {
    console.log("Updating PostcodeArea " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "PostcodeArea body can not be empty" });
    }
    // Find PostcodeArea and update it with the request body
    PostcodeArea.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
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
                message: "Error updating PostcodeArea with id " + req.params.id
            });
        });
};

// Delete a PostcodeArea with the specified MenuId in the request
exports.delete = (req, res) => {
    PostcodeArea.findByIdAndRemove(req.params.id)
        .then(sd => {
            if (!sd) {
                return notFound(req, res);
            }
            res.send({ message: "PostcodeArea deleted successfully!" });
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.prefix === 'NotFound') {
                return notFound(req, res);
            }
            return res.status(500).send({
                message: "Could not delete PostcodeArea with id " + req.params.id
            });
        });
};

/**
 * Persists new PostcodeArea document
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function persist(req, res) {
    const PostcodeArea = buildPostcodeAreaObject(req);
    // Save PostcodeArea in the database
    PostcodeArea.save()
        .then(data => {
            res.status(201).send(data);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the PostcodeArea."
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
    res.status(404).send({ message: `PostcodeArea not found with id ${req.params.id}` });
}

/**
 * Builds PostcodeArea object from Request
 * 
 * @param {Request} req 
 */
function buildPostcodeAreaObject(req) {
    return new PostcodeArea(buildPostcodeAreaJson(req));
}

/**
 * Builds PostcodeArea Json from Request
 * 
 * @param {Request} req 
 */
function buildPostcodeAreaJson(req) {
    return {
        active: true,
        prefix: req.body.prefix,
        name: req.body.name,
        region: req.body.region,
        postTown: req.body.postTown,
        slug: req.body.slug || getSlug(req.body.prefix, req.body.area)
    };
}

/**
 * Returns the slug from the given prefix
 * e.g if prefix = M & S PostcodeAreas then Slug = m-s-PostcodeAreas
 * Replaces special characters and replace space with -
 * 
 * @param {String} prefix 
 */
function getSlug(prefix, area) {
    return prefix.trim().replace(/[\W_]+/g, "-").toLowerCase() + "-" + area.trim().replace(/[\W_]+/g, "_").toLowerCase()
}