const Review = require('../model/chef/review');
const Chef = require('../model/chef/chef');
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
    Review.exists({ order: req.body.order }, function(err, result) {
        if (err) {
            return res.status(500).send({ message: `Error while finding Review with order ${req.body.order}` });
        } else if (result) {
            console.log(`Review already exist for order ${req.body.order}`);
            res.status(400).send({ message: `Review already exist for order ${req.body.order}` });
        } else {
            persist(req, res);
        }
    });

};


// Retrieve and return all Menu from the database.
exports.findAll = (req, res) => {
    let query = Review.find();
    if (req.query.chef) {
        query.where('chef', req.query.chef);
        // query.where('name', { $regex: '.*' + req.query.name + '.*' })
        // query.where({ chef: { '$regex': '.*' + req.query.chef + '.*', '$options': 'i' } })
    }
    if (req.query.order) {
        query.where('order', req.query.order);
    }
    Review.find(query).then(result => {
        console.log(`Returning ${result.length} reviews.`);
        res.send(result);
    }).catch(error => {
        console.log("Error while fetching reviews from database. " + error.message);
        res.status(500).send({
            message: error.message || "Some error occurred while retrieving reviews."
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
            this.updateChef();
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
            updateChef(req);
            res.status(201).send(data);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Review."
            });
        });
}

function updateChef(req) {
    Review.count({ chef: req.body.chef }).then(count => {
        console.log(`Updating chef ${req.body.chef} with number of reviews ${count}`);
        var x = {
            "reviews": count
        }
        Chef.findByIdAndUpdate({ _id: req.body.chef }, x, { upsert: true, setDefaultsOnInsert: true, new: true })
            .then(Chef => {
                if (!Chef) {
                    console.log(`Cannot update review count. Chef not found with id ${req.body.chef}`);
                }
            }).catch(err => {
                if (err.kind === 'ObjectId') {
                    console.log(`Cannot update review count. Chef not found with id ${req.body.chef}`);
                }
            });
    })
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
        chef: req.body.chef,
        rating: req.body.rating,
        title: req.body.title,
        comment: req.body.comment,
        customer: req.body.customer,
        order: req.body.order,
        date: new Date(),
    };
}