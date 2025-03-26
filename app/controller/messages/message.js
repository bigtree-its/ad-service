const Message = require('../../model/messages/message.js');
//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');

// Create and Save a new Message
exports.create = (req, res) => {
    console.log("Received request to create new Message " + JSON.stringify(req.body));
    checkDuplicateAndPersist(req, res);

};

async function checkDuplicateAndPersist(req, res) {
    let query = Message.find();
    if (req.body.customer) {
        query.where('customer.email', req.body.customer.email);
    }
    if (req.body.reason) {
        query.where('reason', req.body.reason);
    }
    var _id = await Message.exists(query);
    if (_id) {
        console.log(`Message already exist`);
        res.status(400).send({ message: `Message already exist` });
    } else {
        persist(req, res);
    }
}


/**
 * Persists new Message document
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function persist(req, res) {
    const Message = buildMessageObject(req);
    // Save Message in the database
    Message.save()
        .then(data => {
            res.status(201).send(data);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Message."
            });
        });
}


// Retrieve and return all Message from the database.
exports.lookup = (req, res) => {
    let query = Message.find();
    if (req.query.email) {
        query.where('customer.email', req.query.email);
    }
    Message.find(query).then(result => {
        console.log(`Returning ${result.length} Messages.`);
        res.send(result);
    }).catch(error => {
        console.log("Error while fetching Message from database. " + error.message);
        res.status(500).send({
            message: error.message || "Some error occurred while retrieving Message."
        });
    });
};


// Find a single Message with a MenuId
exports.findOne = (req, res) => {
    console.log("Received request get a Message with id " + req.params.id);
    Message.findOne({ _id: req.params.id })
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
            return res.status(500).send({ message: "Error while retrieving Message with id " + req.params.id });
        });
};

// Update a Message identified by the MenuId in the request
exports.update = (req, res) => {
    console.log("Updating Message " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "Message body can not be empty" });
    }
    // Find Message and update it with the request body
    Message.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
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
                message: "Error updating Message with id " + req.params.id
            });
        });
};


// Deletes all
exports.deleteEverything = async(req, res) => {
    console.log('Deleting Messages');
    let query = Message.find();
    if (req.query.email) {
        query.where('customer.email', req.query.email);
    }
    Message.deleteMany(query).then(result => {
        console.log("Deleted: " + JSON.stringify(result))
        res.send({ message: "Deleted Messages" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all Messages. ${err.message}`
        });
    });
};

// Delete One
exports.deleteOne = (req, res) => {
    Message.deleteMany(req.params.id).then(result => {
        console.log("Deleted: " + JSON.stringify(result))
        res.send({ message: "Deleted Message" });
    }).catch(err => {
        console.log(`Could not delete Message. ${err.message}`)
        return res.status(500).send({
            message: `Could not delete Message. ${err.message}`
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
    res.status(404).send({ message: `Message not found with id ${req.params.id}` });
}

/**
 * Builds Message object from Request
 * 
 * @param {Request} req 
 */
function buildMessageObject(req) {
    return new Message(buildMessageJson(req));
}

/**
 * Builds Message Json from Request
 * 
 * @param {Request} req 
 */
function buildMessageJson(req) {
    return {
        customer: req.body.customer,
        reason: req.body.reason,
        message: req.body.message,
        date: new Date(),
    };
}