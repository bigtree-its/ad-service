module.exports = (app) => {
    const controller = require('../controller/cuisine.js');
    const { verifyToken } = require('../security/security');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/cuisines';

    // Public routes
    // Retrieve all Cuisine
    app.get(path, controller.findAll);

    // Retrieve a single Cuisine with Id
    app.get(path + '/:id', controller.findOne);

    // Private routes
    // Creates a new Cuisine
    app.post(path,
        // verifyToken, 
        [
            check('name').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Name is mandatory')
        ],
        controller.create);

    // Update a Cuisine with id
    app.put(path + '/:id', controller.update);

    // Delete a Cuisine with id
    app.delete(path + '/:id', controller.delete);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}