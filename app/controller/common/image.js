const Image = require('../../model/common/image');
const ImageKitController = require("../../controller/common/imagekit.js");
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');

// Require Validation Utils
const { errorFormatter } = require('../validation');

// Create and Save a new Image
exports.create = (req, res) => {
    console.log("Creating new Image " + JSON.stringify(req.body));
    var slug = getSlug(req.body);
    console.log(`Finding if a Image already exist for: ${slug}`);
    checkDuplicateAndPersist(req, res);

};

async function checkDuplicateAndPersist(req, res) {
    var slug = getSlug(req.body);
    let query = Image.find();
    query.where('slug', slug);
    var _id = await Image.exists(query);
    if (_id) {
        console.log(`Image already exist`);
        res.status(400).send({ message: `Ad already exist` });
    } else {
        persist(req, res);
    }

}


/**
 * Persists new Image document
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function persist(req, res) {
    const Image = buildImageObject(req);
    // Save Image in the database
    Image.save()
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
    let query = Image.find();
    if (req.query.entity) {
        query.where({
            entity: { $regex: ".*" + req.query.entity + ".*", $options: "i" },
        });
    }
    if (req.query.reference) {
        query.where({
            reference: { $regex: ".*" + req.query.reference + ".*", $options: "i" },
        });
    }
    if (req.query.url) {
        query.where({
            url: { $regex: ".*" + req.query.url + ".*", $options: "i" },
        });
    }
    if (req.query.fileId) {
        query.where({
            fileId: { $regex: ".*" + req.query.fileId + ".*", $options: "i" },
        });
    }
    query.where({ active: true });
    Image.find(query).then(result => {
        console.log(`Returning ${result.length} Images.`);
        res.send(result);
    }).catch(error => {
        console.log("Error while fetching Image from database. " + error.message);
        res.status(500).send({
            message: error.message || "Some error occurred while retrieving Image."
        });
    });
};


// Find a single Image with a MenuId
exports.findOne = (req, res) => {
    console.log("Received request get a Image with id " + req.params.id);
    Image.findOne({ _id: req.params.id })
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
    console.log("Updating Image " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "Image body can not be empty" });
    }
    // Find Image and update it with the request body
    Image.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
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
exports.deleteEverything = async (req, res) => {
    let query = Image.find();
    if (req.query.entity) {
        query.where({
            entity: { $regex: ".*" + req.query.entity + ".*", $options: "i" },
        });
    }
    if (req.query.reference) {
        query.where({
            reference: { $regex: ".*" + req.query.reference + ".*", $options: "i" },
        });
    }
    if (req.query.url) {
        query.where({
            url: { $regex: ".*" + req.query.url + ".*", $options: "i" },
        });
    }
    if (req.query.fileId) {
        query.where({
            fileId: { $regex: ".*" + req.query.fileId + ".*", $options: "i" },
        });
    }
    // console.log('Deleting images matching query ' + JSON.stringify(query))
    await Image.find(query).then(result => {
        console.log(result);
        result.forEach(async e => {
            // Delete from Local
            console.log('Deleting image ' + JSON.stringify(e));
            await e.deleteOne();
            await ImageKitController.deleteByFileId(e.fileId);
        });
    }).catch(error => {
        console.error(error);
    });
    res.send({ message: "Deleted Images" });

    // Image.deleteMany(query).then(result => {
    //     console.log("Deleted: " + JSON.stringify(result))
    //     res.send({ message: "Deleted Images" });
    // }).catch(err => {
    //     return res.status(500).send({
    //         message: `Could not delete all Images. ${err.message}`
    //     });
    // });
};

// Delete One
exports.deleteOne = (req, res) => {
    Image.deleteMany(req.params.id).then(result => {
        console.log("Deleted: " + JSON.stringify(result))
        res.send({ message: "Deleted Image" });
    }).catch(err => {
        console.log(`Could not delete Image. ${err.message}`)
        return res.status(500).send({
            message: `Could not delete Image. ${err.message}`
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
    res.status(404).send({ message: `Image not found with id ${req.params.id}` });
}

/**
 * Builds Image object from Request
 * 
 * @param {Request} req 
 */
function buildImageObject(req) {
    return new Image(buildImageJson(req));
}

/**
 * Builds Image Json from Request
 * 
 * @param {Request} req 
 */
function buildImageJson(req) {
    return {
        fileId: req.body.fileId,
        reference: req.body.reference,
        url: req.body.url,
        name: req.body.name,
        thumbnail: req.body.thumbnail,
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
    return content.reference.trim().replace(/[\W_]+/g, "-").toLowerCase() + "-" + content.fileId.trim().replace(/[\W_]+/g, "_").toLowerCase()
}