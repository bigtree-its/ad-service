const Review = require('../model/chef/review');
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');

// Require Validation Utils
const { validationResult, errorFormatter } = require('./validation');

// Create and Save a new Review
exports.create = (req, res) => {
    console.log("Creating new review " + JSON.stringify(req.body));
    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    Review.exists({ orderReference: req.body.orderReference }, function(err, result) {
        if (err) {
            return res.status(500).send({ message: `Error while finding Review with orderReference ${req.body.orderReference}` });
        } else if (result) {
            console.log(`Review already exist with orderReference ${req.body.orderReference}`);
            res.status(400).send({ message: `Review already exist with orderReference ${req.body.orderReference}` });
        } else {
            persist(req, res);
        }
    });

};


// Retrieve and return all Reviews from the database.
exports.findAll = (req, res) => {
    console.log("Received request to get all reviews");
    Review.find()
        .then(data => {
            if (data) {
                console.log("Returning " + data.length + " reviews.");
                res.send(data);
            } else {
                console.log("Returning no reviews ");
                res.send({});
            }
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving reviews."
            });
        });
};

// Deletes all
exports.deleteEverything = (req, res) => {
    Review.remove().then(result => {
        res.send({ message: "Deleted all reviews" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all reviews. ${err.message}`
        });
    });
};

// Find a single Review with a ReviewId
exports.findOne = (req, res) => {
    console.log("Received request get a review with id " + req.params.id);
    Review.findOne({ _id: req.params.id })
        .then(review => {
            if (!review) {
                return reviewNotFoundWithId(req, res);
            }
            res.send(review);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return reviewNotFoundWithId(req, res);
            }
            return res.status(500).send({ message: "Error while retrieving Review with id " + req.params.id });
        });
};

// Update a Review identified by the ReviewId in the request
exports.update = (req, res) => {
    console.log("Updating review " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "Review body can not be empty" });
    }
    // Find Review and update it with the request body
    Review.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        .then(review => {
            if (!review) {
                return reviewNotFoundWithId(req, res);
            }
            res.send(review);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return reviewNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Error updating Review with id " + req.params.id
            });
        });
};

// Delete a Review with the specified ReviewId in the request
exports.delete = (req, res) => {
    Review.findByIdAndRemove(req.params.id)
        .then(review => {
            if (!review) {
                return reviewNotFoundWithId(req, res);
            }
            res.send({ message: "Review deleted successfully!" });
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                return reviewNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Could not delete Review with id " + req.params.id
            });
        });
};

/**
 * Persists new Review document
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function persist(req, res) {
    const review = buildReviewObject(req);
    // Save Review in the database
    review.save()
        .then(data => {
            res.status(201).send(data);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Review."
            });
        });
}

/**
 * Sends 404 HTTP Response with Message
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function reviewNotFoundWithId(req, res) {
    res.status(404).send({ message: `Review not found with id ${req.params.id}` });
}

/**
 * Builds Review object from Request
 * 
 * @param {Request} req 
 */
function buildReviewObject(req) {
    return new Review(buildReviewJson(req));
}

/**
 * Builds Review Json from Request
 * 
 * @param {Request} req 
 */
function buildReviewJson(req) {

    return {
        chefId: req.body.chefId,
        rating: req.body.rating,
        title: req.body.title,
        comment: req.body.comment,
        customer: req.body.customer,
        order: req.body.order,
        date: new Date(),
    };
}