const Calendar = require('../model/chef/calendar');
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');

// Require Validation Utils
const { validationResult, errorFormatter } = require('./validation');

// Create and Save a new Calendar
exports.create = (req, res) => {
    console.log("Creating new Calendar " + JSON.stringify(req.body));
    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    console.log(`Finding if a Calendar already exist`);
    Calendar.exists({ chefId: req.body.chefId, orderBefore: req.body.orderBefore }, function(err, result) {
        if (err) {
            return res.status(500).send({ message: `Error while finding Calendar for Chef ${req.body.chefId} on ${req.body.orderBefore}` });
        } else if (result) {
            console.log(`Calendar already exist for Chef ${req.body.chefId} on ${req.body.orderBefore}`);
            res.status(400).send({ message: `Calendar already exist for Chef ${req.body.chefId} on ${req.body.orderBefore}` });
        } else {
            persist(req, res);
        }
    });

};


// Retrieve and return all Calendars from the database.
exports.findAll = (req, res) => {
    console.log("Received request to get all Calendars");
    if (Object.keys(req.query).length > 0) {
        return this.lookup(req, res);
    }
    console.log(`Contains Query Params: ${Object.keys(req.query).length}`);
    Calendar.find()
        .then(data => {
            if (data) {
                console.log("Returning " + data.length + " Calendars.");
                res.send(data);
            } else {
                console.log("Returning no Calendars ");
                res.send({});
            }
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving Calendars."
            });
        });
};

function addDays(theDate, days) {
    return new Date(theDate.getTime() + days * 24 * 60 * 60 * 1000);
}

// Retrieve and return all local area from the database.
exports.lookup = (req, res) => {
    console.log(`Looking for calendars`)
    let query = Calendar.find();
    if (req.query.chef) {
        console.log(`Query ChefId : ${req.query.chef}`)
        query.where({ chefId: req.query.chef })
    }
    if (req.query.orderBefore) {
        query.where({ orderBefore: req.query.orderBefore })
    }
    if (req.query.thisweek) {
        let today = new Date();
        let dayOfWeekNumber = today.getDay();
        let endDays = 7 - dayOfWeekNumber;
        var endDate = addDays(today, endDays);
        console.log(`Calendars with start date ${today}, end date: ${endDate}`)
        query.where({ orderBefore: { $gte: today, $lte: endDate } })
    }
    console.log(`Looking for calendars with ${query}`);
    Calendar.find(query)
        .populate({
            path: 'foods'
        })
        .then(result => {
            console.log(`Returning ${result.length} calendars`);
            res.send(result);
        }).catch(error => {
            console.log("Error while fetching from database. " + error.message);
            res.status(500).send({
                message: error.message || "Some error occurred while retrieving calendars."
            });
        });

};

// Deletes all
exports.deleteEverything = (req, res) => {
    Calendar.remove().then(result => {
        res.send({ message: "Deleted all Calendars" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all Calendars. ${err.message}`
        });
    });
};

// Find a single Calendar with a CalendarId
exports.findOne = (req, res) => {
    console.log("Received request get a Calendar with id " + req.params.id);
    Calendar.findOne({ _id: req.params.id })
        .then(Calendar => {
            if (!Calendar) {
                return CalendarNotFoundWithId(req, res);
            }
            res.send(Calendar);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return CalendarNotFoundWithId(req, res);
            }
            return res.status(500).send({ message: "Error while retrieving Calendar with id " + req.params.id });
        });
};

// Update a Calendar identified by the CalendarId in the request
exports.update = (req, res) => {
    console.log("Updating Calendar " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "Calendar body can not be empty" });
    }
    // Find Calendar and update it with the request body
    Calendar.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        .then(Calendar => {
            if (!Calendar) {
                return CalendarNotFoundWithId(req, res);
            }
            res.send(Calendar);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return CalendarNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Error updating Calendar with id " + req.params.id
            });
        });
};

// Delete a Calendar with the specified CalendarId in the request
exports.delete = (req, res) => {
    Calendar.findByIdAndRemove(req.params.id)
        .then(Calendar => {
            if (!Calendar) {
                return CalendarNotFoundWithId(req, res);
            }
            res.send({ message: "Calendar deleted successfully!" });
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                return CalendarNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Could not delete Calendar with id " + req.params.id
            });
        });
};

/**
 * Persists new Calendar document
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function persist(req, res) {
    const Calendar = buildCalendarObject(req);
    // Save Calendar in the database
    Calendar.save()
        .then(data => {
            console.log(`Calendar persisted with Id ${data._id}`)
            res.status(201).send(data);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Calendar."
            });
        });
}

/**
 * Sends 404 HTTP Response with Message
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function CalendarNotFoundWithId(req, res) {
    res.status(404).send({ message: `Calendar not found with id ${req.params.id}` });
}

/**
 * Builds Calendar object from Request
 * 
 * @param {Request} req 
 */
function buildCalendarObject(req) {
    return new Calendar(buildCalendarJson(req));
}

/**
 * Builds Calendar Json from Request
 * 
 * @param {Request} req 
 */
function buildCalendarJson(req) {
    return {
        chefId: req.body.chefId,
        orderBefore: req.body.orderBefore,
        collectionStartDate: req.body.collectionStartDate,
        collectionEndDate: req.body.collectionEndDate,
        deliveryStartDate: req.body.deliveryStartDate,
        deliveryEndDate: req.body.deliveryEndDate,
        foods: req.body.foods,
        description: req.body.description
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