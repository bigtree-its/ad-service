//Require Supplier Model
const Supplier = require("../../model/common/supplier.js");
const CloudflareImageUtils = require("../../utils/cloudflare-image-util.js");
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require("underscore");
//Require Generate Safe Id for Random unique id Generation
// var generateSafeId = require('generate-safe-id');
// Require Validation Utils
const { validationResult, errorFormatter } = require("../validation.js");
const Utils = require("../../utils/utils.js");
const nodemailer = require('nodemailer');
const handlebars = require("handlebars");
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);


const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email provider
    auth: {
        user: process.env.NOTIFICATION_SENDER_EMAIL_ID,
        pass: process.env.NOTIFICATION_SENDER_EMAIL_PASSWORD
    }
});

function isEmpty(data) {
    if (data === undefined || data === null || data.length === 0) {
        return true;
    }
    return false;
}

// Create and Save a new Supplier
exports.create = async(req, res) => {
    console.log("Creating new Supplier ");
    /** Check for validation errors */
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    /** Persist */
    checkDuplicateAndPersist(req, res);
};



async function checkDuplicateAndPersist(req, res) {
    console.log(`Checking if Supplier already exist..`);
    var slug = getSlug(req.body.name, req.body.address.postcode);
    var _id = await Supplier.exists({ slug: slug });
    if (_id) {
        console.log(`Supplier already exist with name ${req.body.name}`);
        res
            .status(400)
            .send({
                message: `Supplier already exist with name ${req.body.name}`,
            });
    } else {
        persist(req, res);
    }
}

exports.paginate = (req, res) => {
    req.query.page = req.query.page || 1;
    req.query.limit = req.query.limit || 25;
    const options = { page: req.query.page, limit: req.query.limit };
    let query = Supplier.find();
    if (req.query.name) {
        query.where("name", { $regex: ".*" + req.query.name + ".*" });
    }
    if (req.query.email) {
        query.where("email", { $in: req.query.email });
    }
    if (req.query.postcode) {
        query.where("address.postcode", { $in: req.query.postcode });
    }
    Supplier.aggregatePaginate(query, options, function(err, result) {
        if (result) {
            console.log(`Returning ${result.docs.length} Suppliers.`);
            res.send(result);
        } else if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving Suppliers.",
            });
        }
    });
};

// Retrieve and return all Suppliers from the database.
exports.findAll = (req, res) => {
    console.log("Fetching all suppliers..");
    let query = Supplier.find();
    Supplier.find(query)
        .then((result) => {
            console.log(`Returning ${result.length} Suppliers.`);
            res.send(result);
        })
        .catch((error) => {
            console.log("Error while fetching from database. " + error.message);
            res.status(500).send({
                message: error.message ||
                    "Some error occurred while retrieving Suppliers.",
            });
        });
};


// Retrieve and return all Suppliers from the database.
exports.lookup = async(req, res) => {
    console.log("Finding suppliers..");
    let query = Supplier.find();
    if (req.query.area) {
        var inAreaList = []; //holding RegExp objects of case-insensitive talents list 
        [req.query.area].forEach(a => {
            var inArea = RegExp(`^${a}`, 'i') //RegExp object contains talent pattern and case-insensitive option
            inAreaList.push(inArea)
        });

        // query.where("serviceAreas", { $in: inAreaList });
        query.where({ $or: [{ "serviceAreas": { $in: req.query.area } }] });
        query.where({ $or: [{ "nationwide": true }] });
    }
    if (req.query.supplierIds) {
        console.log(
            "Received request to filter by supplierIds: " +
            req.query.supplierIds
        );
        // If supplierIds is provided, convert it to an array and filter
        var supplierIds = [];
        if (typeof req.query.supplierIds === "string") {
            supplierIds = req.query.supplierIds.split(",");
        } else if (Array.isArray(req.query.supplierIds)) {
            supplierIds = req.query.supplierIds;
        } else {
            console.error("Invalid supplierIds format: " + req.query.supplierIds);
            return res.status(400).send({
                message: "Invalid supplierIds format. It should be a comma-separated string or an array.",
            });
        }
        // Ensure supplierIds are valid ObjectId strings
        supplierIds = supplierIds
            .map((id) => {
                if (/^[0-9a-fA-F]{24}$/.test(id)) {
                    return id;
                } else {
                    console.error("Invalid ObjectId format: " + id);
                    return null; // Filter out invalid ObjectIds
                }
            })
            .filter((id) => id !== null); // Remove any null values
        if (!supplierIds || supplierIds.length === 0) {
            console.error("No valid supplierIds provided.");
            return res.status(400).send({
                message: "No valid supplierIds provided.",
            });
        }
        console.log("Filtering products by supplierIds: " + supplierIds);
        // Use $in operator to filter products by supplierIds
        query.where("_id", { $in: supplierIds });
    }
    if (req.query.nationwide) {
        query.where("nationwide", true);
    }
    if (req.query.slug) {
        query.where("slug", req.query.slug);
    }
    if (req.query.active) {
        query.where("active", req.query.active);
    }
    if (req.query.onOffer) {
        query.where("onOffer", req.query.onOffer);
    }
    if (req.query.delivery) {
        query.where("delivery", true);
    }
    if (req.query.keywords) {
        var inKeywordsList = []; //holding RegExp objects of case-insensitive talents list 
        [req.query.keywords].forEach(kw => {
            var inKeyword = RegExp(`^${kw}`, 'i') //RegExp object contains talent pattern and case-insensitive option
            inKeywordsList.push(inKeyword)
        });
        query.where("keywords", { $in: req.query.keywords });
    }
    if (req.query.noMinimumOrder) {
        query.where("noMinimumOrder", true);
    }
    if (req.query.email) {
        query.where("contact.email", req.query.email);
    }
    if (req.query.name) {
        query.where({ name: new RegExp(req.query.name, 'i') });
    }
    Supplier.find(query)
        .then((result) => {
            console.log(`Returning ${result.length} Suppliers.`);
            res.send(result);
        })
        .catch((error) => {
            console.log("Error while fetching from database. " + error.message);
            res.status(500).send({
                message: error.message ||
                    "Some error occurred while retrieving Suppliers.",
            });
        });
};
// Find if Supplier with a name already exist
exports.checkAvailability = (req, res) => {
    console.log(`Finding if supplier name exist`);
    let query = Supplier.find();
    if (req.query.name) {
        query.where("name", req.query.name);
    }
    Supplier.find(query).collation({ locale: 'en', strength: 2 })
        .then((result) => {
            console.log(`Returning ${result.length} Suppliers.`);
            res.send(result);
        })
        .catch((error) => {
            console.log("Error while fetching from database. " + error.message);
            res.status(500).send({
                message: error.message ||
                    "Some error occurred while retrieving Suppliers.",
            });
        });
};

// Find a single Supplier with a BrandId
exports.findOne = (req, res) => {
    console.log(`Finding a supplier ${req.params.id}`);
    const filter = { _id: req.params.id };
    Supplier.findById(filter)
        .then((data) => {
            if (!data) {
                return res
                    .status(404)
                    .send({ message: `Supplier not found with id ${req.params.id}` });
            }
            console.log(`Found Supplier ${data.name}`);
            res.send(data);
        })
        .catch((err) => {
            if (err.kind === "ObjectId") {
                return res
                    .status(404)
                    .send({ message: `Supplier not found with id ${req.params.id}` });
            }
            return res
                .status(500)
                .send({
                    message: `Error while retrieving Supplier with id ${req.params.id}`,
                });
        });
};

// Update a Supplier
exports.update = (req, res) => {
    console.log(`Updating Supplier ${req.params.id}`);
    // Validate Request
    if (!req.body) {
        return res
            .status(400)
            .send({ message: "Supplier body cannot be empty" });
    }
    if (req.body.type) {
        this.validateType(req, res, req.body.type);
    }
    const filter = { _id: req.params.id };
    // Find Supplier and update it with the request body
    Supplier.findOneAndUpdate(filter, req.body)
        .populate("serviceAreas")
        .then((Supplier) => {
            if (!Supplier) {
                return res
                    .status(404)
                    .send({ message: `Supplier not found with id ${req.params.id}` });
            }
            res.send(Supplier);
        })
        .catch((err) => {
            if (err.kind === "ObjectId") {
                return res
                    .status(404)
                    .send({ message: `Supplier not found with id ${req.params.id}` });
            }
            return res
                .status(500)
                .send({
                    message: `Error updating Supplier with id ${req.params.id}`,
                });
        });
};

// Deletes a Supplier with the specified BrandId in the request
exports.delete = async(req, res) => {
    var _ids = await Supplier.find({ _id: req.params.id }, "_id");
    Supplier.deleteOne({ _id: req.params.id })
        .then((result) => {
            console.log("Deleted Supplier " + JSON.stringify(result));
            res.send({ message: "Supplier deleted successfully!" });
            if (_ids) {
                CloudflareImageUtils.deleteImages(_ids);
            }
        })
        .catch((err) => {
            console.error(
                "Error while deleting supplier " + JSON.stringify(err)
            );
            if (err.kind === "ObjectId" || err.name === "NotFound") {
                res
                    .status(404)
                    .send({ message: `Supplier not found with id ${req.params.id}` });
            } else {
                res
                    .status(500)
                    .send({
                        message: `Could not delete Supplier with id ${req.params.id}`,
                    });
            }
        });
};

// Deletes a Supplier with the specified BrandId in the request
exports.deleteEverything = (req, res) => {
    Supplier.deleteMany()
        .then((result) => {
            res.send({ message: "Deleted all Suppliers" });
        })
        .catch((err) => {
            return res.status(500).send({
                message: `Could not delete all Suppliers. ${err.message}`,
            });
        });
};

/**
 * Persists new Supplier Model
 *
 * @param {Request} req The HTTP Request
 * @param {Response} res The HTTP Response
 */
function persist(req, res) {
    const localSupplier = buildSupplier(req);
    console.log(
        `Attempting to persist Supplier ` + JSON.stringify(localSupplier)
    );
    // Save Supplier in the database
    localSupplier
        .save()
        .then((data) => {
            console.log(`Persisted Supplier: ${data._id}`);
            sendNotificationToAdmin('Admin', process.env.ADMIN_EMAIL_ID, data._id);
            sendEmailToCustomer(req.body.contact.person, req.body.contact.email, req.body.name);
            res.status(201).send(data);
        })
        .catch((err) => {
            console.error("Save failed. " + err);
            res
                .status(500)
                .send({
                    message: err.message ||
                        "Some error occurred while creating the Supplier.",
                });
        });
}

async function sendEmailToCustomer(recipientName, recipientEmail, kitchenName) {
    // Read the HTML template and image file
    var htmlPath = path.join(__dirname, '../../..', 'public', 'email-to-customer.html');
    // var imgFilePath = path.join(__dirname, '../../..', 'public', 'mmm-logo.png');
    const htmlTemplate = await readFileAsync(htmlPath, 'utf-8');
    // const imageAttachment = await readFileAsync(imgFilePath);

    var template = handlebars.compile(htmlTemplate);
    var replacements = {
        username: recipientName,
        kitchenName: kitchenName,
    };
    var htmlToSend = template(replacements);

    // Send email
    const info = await transporter.sendMail({
        from: process.env.NOTIFICATION_SENDER_EMAIL_ID,
        to: recipientEmail,
        subject: 'Foodogram - Thanks for you interest',
        html: htmlToSend,
        //Enable this to attach a file 
        // attachments: [{
        //     filename: 'mmm-logo.png',
        //     content: imageAttachment,
        //     encoding: 'base64',
        //     cid: 'uniqueImageCID', // Referenced in the HTML template
        // }],
    });

    console.log('Email sent:', info.messageId);
}

function sendNotificationToAdmin(recipientName, recipientEmail, kitchenId) {

    let mailOptions = {
        from: process.env.NOTIFICATION_SENDER_EMAIL_ID,
        to: recipientEmail,
        subject: "New Interest received for kitchen Partner",
        text: 'Hi ' + recipientName + ', New Interest received to become a kitchen Partner. Kitchen ID :' + kitchenId,
    };
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent to admin: ' + info.response);
        }
    });
}

/**
 * Builds Supplier from incoming Request.
 * @returns Supplier Model
 * @param {Request} req
 */
function buildSupplier(req) {
    return new Supplier(buildSupplierJson(req));
}

/**
 * Builds Supplier JSON incoming Request.
 *
 * @returns {String} Supplier JSON
 * @param {Request} req
 */
function buildSupplierJson(req) {
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
        collectionTimings: data.collectionTimings,
        slug: slug,
        serviceAreas: data.serviceAreas,
        keywords: data.keywords,
        contact: data.contact,
        address: data.address,
        collectionPoints: data.collectionPoints,
        rating: data.rating,
        reviews: data.reviews,
        doDelivery: data.doDelivery,
        deliveryFee: data.deliveryFee,
        freeDeliveryOver: data.freeDeliveryOver,
        packagingFee: data.packagingFee,
        minimumOrder: data.minimumOrder,
        preOrderOnly: data.preOrderOnly,
        open: data.open,
        nationwide: data.nationwide,
        reopen: data.reopen,
        active: data.active,
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
    return (
        name
        .trim()
        .replace(/[\W_]+/g, "-")
        .toLowerCase() +
        "-" +
        postcode
        .trim()
        .replace(/[\W_]+/g, "-")
        .toLowerCase()
    );
}