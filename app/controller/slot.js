const Slot = require('../model/chef/slot');
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');

// Require Validation Utils
const { validationResult, errorFormatter } = require('./validation');

// Create and Save a new Slot
exports.create = (req, res) => {
    console.log("Creating new slot " + JSON.stringify(req.body));
    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    console.log(`Finding if a slot already exist with name ${req.body.name}`);
    Slot.exists({ name: req.body.name }, function(err, result) {
        if (err) {
            return res.status(500).send({ message: `Error while finding Slot with name ${req.body.name}` });
        } else if (result) {
            console.log(`Slot already exist with name ${req.body.name}`);
            return res.status(400).send({ message: `Slot already exist with name ${req.body.name}` });
        } else {
            persist(req, res);
        }
    });

};


// Retrieve and return all Slots from the database.
exports.findAll = (req, res) => {
    console.log("Received request to get all slots");
    Slot.find()
        .then(data => {
            if (data) {
                console.log("Returning " + data.length + " slots.");
                res.send(data);
            } else {
                console.log("Returning no slots ");
                res.send({});
            }
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving slots."
            });
        });
};

// Deletes all
exports.deleteEverything = (req, res) => {
    Slot.remove().then(result => {
        res.send({ message: "Deleted all slots" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all slots. ${err.message}`
        });
    });
};

// Find a single Slot with a SlotId
exports.findOne = (req, res) => {
    console.log("Received request get a slot with id " + req.params.id);
    Slot.findOne({ _id: req.params.id })
        .then(slot => {
            if (!slot) {
                return slotNotFoundWithId(req, res);
            }
            res.send(slot);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return slotNotFoundWithId(req, res);
            }
            return res.status(500).send({ message: "Error while retrieving Slot with id " + req.params.id });
        });
};

// Update a Slot identified by the SlotId in the request
exports.update = (req, res) => {
    console.log("Updating slot " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "Slot body can not be empty" });
    }
    // Find Slot and update it with the request body
    Slot.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        .then(slot => {
            if (!slot) {
                return slotNotFoundWithId(req, res);
            }
            res.send(slot);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return slotNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Error updating Slot with id " + req.params.id
            });
        });
};

// Delete a Slot with the specified SlotId in the request
exports.delete = (req, res) => {
    Slot.findByIdAndRemove(req.params.id)
        .then(slot => {
            if (!slot) {
                return slotNotFoundWithId(req, res);
            }
            res.send({ message: "Slot deleted successfully!" });
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                return slotNotFoundWithId(req, res);
            }
            return res.status(500).send({
                message: "Could not delete Slot with id " + req.params.id
            });
        });
};

/**
 * Persists new Slot document
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function persist(req, res) {
    const slot = buildSlotObject(req);
    // Save Slot in the database
    slot.save()
        .then(data => {
            res.status(201).send(data);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Slot."
            });
        });
}

/**
 * Sends 404 HTTP Response with Message
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function slotNotFoundWithId(req, res) {
    res.status(404).send({ message: `Slot not found with id ${req.params.id}` });
}

/**
 * Builds Slot object from Request
 * 
 * @param {Request} req 
 */
function buildSlotObject(req) {
    return new Slot(buildSlotJson(req));
}

/**
 * Builds Slot Json from Request
 * 
 * @param {Request} req 
 */
function buildSlotJson(req) {
    return {
        name: req.body.name,
        slug: req.body.slug || req.body.name.trim().replace(/[\W_]+/g, "-").toLowerCase(),
        logo: req.body.logo
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