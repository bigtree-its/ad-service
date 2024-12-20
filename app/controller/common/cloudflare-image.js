const CloudflareImage = require('../../model/common/cloudflare-image.js');
const CloudflareImageApiClient = require("../../controller/common/cloudflare-image-api-client.js");
const _ = require('underscore');

// Create and Save a new CloudflareImage
exports.create = (req, res) => {
    console.log("Creating new CloudflareImage " + JSON.stringify(req.body));
    var slug = getSlug(req.body);
    console.log(`Finding if a CloudflareImage already exist for: ${slug}`);
    checkDuplicateAndPersist(req, res);

};

async function checkDuplicateAndPersist(req, res) {
    var slug = getSlug(req.body);
    let query = CloudflareImage.find();
    query.where('slug', slug);
    var _id = await CloudflareImage.exists(query);
    if (_id) {
        console.log(`CloudflareImage already exist`);
        res.status(400).send({ message: `CloudflareImage already exist` });
    } else {
        persist(req, res);
    }
}

/**
 * Persists new CloudflareImage document
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function persist(req, res) {
    const CloudflareImage = buildCloudflareImageObject(req);
    // Save Image in the database
    CloudflareImage.save()
        .then(data => {
            res.status(201).send(data);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Image."
            });
        });
}

// Retrieve and return all Image from the database.
exports.lookup = (req, res) => {
    let query = CloudflareImage.find();
    if (req.query.entity) {
        query.where({
            entity: { $regex: ".*" + req.query.entity + ".*", $options: "i" },
        });
    }
    if (req.query.entityId) {
        query.where({
            reference: { $regex: ".*" + req.query.entityId + ".*", $options: "i" },
        });
    }
    if (req.query.cloudflareImageUrl) {
        query.where({
            cloudflareImageUrl: { $regex: ".*" + req.query.cloudflareImageUrl + ".*", $options: "i" },
        });
    }
    query.where({ active: true });
    CloudflareImage.find(query).then(result => {
        console.log(`Returning ${result.length} CloudflareImages.`);
        res.send(result);
    }).catch(error => {
        console.log("Error while fetching a CloudflareImage from database. " + error.message);
        res.status(500).send({
            message: error.message || "Some error occurred while retrieving CloudflareImage."
        });
    });
};


// Find a single Image with a MenuId
exports.findOne = (req, res) => {
    console.log("Received request get a CloudflareImage with id " + req.params.id);
    CloudflareImage.findOne({ _id: req.params.id })
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
            return res.status(500).send({ message: "Error while retrieving Image with id " + req.params.id });
        });
};

// Update a Image identified by the MenuId in the request
exports.update = (req, res) => {
    console.log("Updating CloudflareImage " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "CloudflareImage body can not be empty" });
    }
    // Find Image and update it with the request body
    CloudflareImage.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
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
                message: "Error updating Image with id " + req.params.id
            });
        });
};


// Deletes all
exports.deleteEverything = async(req, res) => {
    console.log('Delete Clouflare Images from local and remote');
    let query = CloudflareImage.find();
    if (req.query.entity) {
        query.where({
            entity: { $regex: ".*" + req.query.entity + ".*", $options: "i" },
        });
    }
    if (req.query.entityId) {
        query.where({
            entityId: { $regex: ".*" + req.query.entityId + ".*", $options: "i" },
        });
    }
    if (req.query.cloudflareImageUrl) {
        query.where({
            cloudflareImageUrl: { $regex: ".*" + req.query.cloudflareImageUrl + ".*", $options: "i" },
        });
    }
    if (req.query.cloudflareImageId) {
        query.where({
            cloudflareImageId: { $regex: ".*" + req.query.cloudflareImageId + ".*", $options: "i" },
        });
    }
    await CloudflareImage.find(query).then(result => {
        console.log(result);
        result.forEach(async e => {
            // Delete from Local
            console.log('Deleting a CloudflareImage on local.. ' + JSON.stringify(e));
            await e.deleteOne();
            console.log('Deleting a CloudflareImage on remote.. ' + JSON.stringify(e));
            await CloudflareImageApiClient.deleteById(e.cloudflareImageId);
        });
    }).catch(error => {
        console.error(error);
    });
    res.send({ message: "Deleted CloudflareImages" });
};

// Delete One
exports.deleteOne = (req, res) => {
    CloudflareImage.deleteMany(req.params.id).then(result => {
        console.log("Deleted: " + JSON.stringify(result))
        res.send({ message: "Deleted CloudflareImage" });
    }).catch(err => {
        console.log(`Could not delete CloudflareImage. ${err.message}`)
        return res.status(500).send({
            message: `Could not delete CloudflareImage. ${err.message}`
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
    res.status(404).send({ message: `CloudflareImage not found with id ${req.params.id}` });
}

/**
 * Builds Image object from Request
 * 
 * @param {Request} req 
 */
function buildCloudflareImageObject(req) {
    return new CloudflareImage(buildCloudflareImageJson(req));
}

/**
 * Builds Image Json from Request
 * 
 * @param {Request} req 
 */
function buildCloudflareImageJson(req) {
    return {
        cloudflareImageId: req.body.cloudflareImageId,
        cloudflareImageUrl: req.body.cloudflareImageUrl,
        cloudflareImageFilename: req.body.cloudflareImageFilename,
        uploaded: req.body.uploaded,
        entity: req.body.entity,
        entityId: req.body.entityId,
        active: true,
        slug: req.body.slug || getSlug(req.body)
    };
}

/**
 * Returns the slug from the given prefix
 * e.g if prefix = M & S Images then Slug = m-s-Images
 * Replaces special characters and replace space with -
 * 
 * @param {String} content 
 */
function getSlug(content) {
    return content.entity.trim().replace(/[\W_]+/g, "-").toLowerCase() + "-" +content.reference.trim().replace(/[\W_]+/g, "-").toLowerCase() + "-" + content.id.trim().replace(/[\W_]+/g, "_").toLowerCase()
}