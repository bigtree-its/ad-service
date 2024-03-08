//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require("underscore");

// Require Validation Utils
const { validationResult, errorFormatter } = require("../validation");
const Feedback = require("../../model/products/feedback");

// Create and Save a new Feedback
exports.create = (req, res) => {
    console.log("Creating new Feedback " + JSON.stringify(req.body));
    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    Feedback.exists({ product: req.body.product, order: req.body.order }, function (err, result) {
        if (err) {
            return res
                .status(500)
                .send({
                    message: `Error while finding Feedback with order ${req.body.order}`,
                });
        } else if (result) {
            console.log(`Feedback already exist for order ${req.body.order}`);
            res
                .status(400)
                .send({ message: `Feedback already exist for order ${req.body.order}` });
        } else {
            persist(req, res);
        }
    });
};

// Retrieve and return all Menu from the database.
exports.findAll = (req, res) => {
    let query = Feedback.find();
    if (req.query.chef) {
        query.where("chef", req.query.chef);
        // query.where('name', { $regex: '.*' + req.query.name + '.*' })
        // query.where({ chef: { '$regex': '.*' + req.query.chef + '.*', '$options': 'i' } })
    }
    if (req.query.order) {
        query.where("order", req.query.order);
    }
    Feedback.find(query)
        .then((result) => {
            console.log(`Returning ${result.length} Feedbacks.`);
            res.send(result);
        })
        .catch((error) => {
            console.log(
                "Error while fetching Feedbacks from database. " + error.message
            );
            res.status(500).send({
                message: error.message || "Some error occurred while retrieving Feedbacks.",
            });
        });
};

// Deletes all
exports.deleteEverything = (req, res) => {
    Feedback.remove()
        .then((result) => {
            res.send({ message: "Deleted all Feedbacks" });
        })
        .catch((err) => {
            return res.status(500).send({
                message: `Could not delete all Feedbacks. ${err.message}`,
            });
        });
};

// Find a single Feedback with a FeedbackId
exports.findOne = (req, res) => {
    console.log("Received request get a Feedback with id " + req.params.id);
    Feedback.findOne({ _id: req.params.id })
        .then((Feedback) => {
            if (!Feedback) {
                return FeedbackNotFoundWithId(req, res);
            }
            res.send(Feedback);
        })
        .catch((err) => {
            if (err.kind === "ObjectId") {
                return FeedbackNotFoundWithId(req, res);
            }
            return res
                .status(500)
                .send({
                    message: "Error while retrieving Feedback with id " + req.params.id,
                });
        });
};

// Update a Feedback identified by the FeedbackId in the request
exports.update = (req, res) => {
    console.log("Updating Feedback " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "Feedback body can not be empty" });
    }
    // Find Feedback and update it with the request body
    Feedback.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        .then((Feedback) => {
            if (!Feedback) {
                return FeedbackNotFoundWithId(req, res);
            }
            res.send(Feedback);
        })
        .catch((err) => {
            if (err.kind === "ObjectId") {
                return FeedbackNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Error updating Feedback with id " + req.params.id,
            });
        });
};

// Delete a Feedback with the specified FeedbackId in the request
exports.delete = (req, res) => {
    Feedback.findByIdAndRemove(req.params.id)
        .then((Feedback) => {
            if (!Feedback) {
                return FeedbackNotFoundWithId(req, res);
            }
            this.updateChef();
            res.send({ message: "Feedback deleted successfully!" });
        })
        .catch((err) => {
            if (err.kind === "ObjectId" || err.name === "NotFound") {
                return FeedbackNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Could not delete Feedback with id " + req.params.id,
            });
        });
};

/**
 * Persists new Feedback document
 *
 * @param {Request} req
 * @param {Response} res
 */
function persist(req, res) {
    const feedbackObj = buildFeedbackObject(req);
    // Save Feedback in the database
    feedbackObj
        .save()
        .then((data) => {
            updateProduct(req);
            res.status(201).send(data);
        })
        .catch((err) => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Feedback.",
            });
        });
}

async function updateProduct(req) {
    const product = req.body.product;
    const totalFeedbacks = await Feedback.countDocuments({ product: req.body.product });
    const avgResult = await Feedback.aggregate([{
        $match: {
            product: product,
        },
    },
    {
        $group: {
            _id: null,
            avgValue: { "$avg": { "$ifNull": ["$rating", 0] } }
        }
    }
    ]);
    const avgRating = avgResult[0].avgValue;
    var rounded = Math.round(avgRating * 10) / 10
    console.log(`Average Rating: ${rounded}`);
    console.log(`Total Feedbacks: ${totalFeedbacks}`);
    var x = {
        Feedbacks: totalFeedbacks,
        rating: rounded,
    };

    Product.findByIdAndUpdate({ _id: req.body.product }, x, {
        upsert: true,
        setDefaultsOnInsert: true,
        new: true,
    })
        .then((Product) => {
            if (!Product) {
                console.log(
                    `Cannot update Feedback count. Product not found with id ${req.body.product}`
                );
            }
        })
        .catch((err) => {
            if (err.kind === "ObjectId") {
                console.log(
                    `Cannot update Feedback count. Product not found with id ${req.body.product}`
                );
            }
        });
}

/**
 * Sends 404 HTTP Response with Message
 *
 * @param {Request} req
 * @param {Response} res
 */
function FeedbackNotFoundWithId(req, res) {
    res
        .status(404)
        .send({ message: `Feedback not found with id ${req.params.id}` });
}

/**
 * Builds Feedback object from Request
 *
 * @param {Request} req
 */
function buildFeedbackObject(req) {
    return new Feedback(buildFeedbackJson(req));
}

/**
 * Builds Feedback Json from Request
 *
 * @param {Request} req
 */
function buildFeedbackJson(req) {
    return {
        product: req.body.product,
        order: req.body.order,
        rating: req.body.rating,
        title: req.body.title,
        comment: req.body.comment,
        customer: req.body.customer,
        order: req.body.order,
        date: new Date(),
    };
}