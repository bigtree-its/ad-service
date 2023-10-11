module.exports = (app) => {
    const controller = require('../controller/chef.js');
    const { verifyToken } = require('../security/security.js');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/chefs';

    // Public routes
    // Retrieve all Chef
    app.get(path, controller.findAll);

    // Retrieve a single Chef with Id
    app.get(path + '/:id', controller.findOne);

    // Private routes
    // Creates a new Chef
    app.post(path,
        // verifyToken, 
        [
            check('name').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Name is mandatory'),
            check('email').notEmpty().isEmail().withMessage('Email is mandatory'),
            check('description').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Description is mandatory'),
            check('address.postcode').notEmpty().isLength({ min: 5, max: 7 }).withMessage('Postcode is mandatory'),
            check('contact.person').notEmpty().isLength({ min: 3, max: 30 }).withMessage('Contact person is mandatory'),
            check('contact.email').notEmpty().isEmail().withMessage('Contact Email is mandatory'),
            check('contact.telephone').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Contact Telephone is mandatory'),
        ],
        controller.create);

    // Update a Chef with id
    app.put(path + '/:id', controller.update);

    // Delete a Chef with id
    app.delete(path + '/:id', controller.delete);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}