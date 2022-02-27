module.exports = (app) => {
    const enquiries = require('../controller/property-enquiry.js');
    const { verifyToken } = require('../security/security');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/properties/enquiries';
    // Public routes
    // Retrieve all Quesstions
    app.get(path, enquiries.findAll);

    // Retrieve a single Question with Id
    app.get(path + '/:id', enquiries.findOne);

    // Private routes
    // Creates a new Question
    app.post(path,
        // verifyToken, 
        [
            check('property').exists().isMongoId().withMessage('Property is not valid')
        ],
        enquiries.create);

    // Update a Question with id
    app.put(path + '/:id', enquiries.update);

    // Delete a Question with id
    app.delete(path + '/:id', enquiries.delete);

    // Delete All -- only for non production and can only be done by an admin
    app.delete(path, enquiries.deleteAll);
}