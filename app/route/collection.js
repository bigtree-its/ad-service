module.exports = (app) => {
    const controller = require('../controller/collection.js');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/collections';

    // Public routes
    // Retrieve all Collection
    app.get(path, controller.findAll);

    // Retrieve a single Collection with Id
    app.get(path + '/:id', controller.findOne);

    // Private routes
    // Creates a new Collection
    app.post(path,
        // verifyToken, 
        [
            check('name').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Name is mandatory'),
            check('chefId').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Chef is mandatory')
        ],
        controller.create);

    // Update a Collection with id
    app.put(path + '/:id', controller.update);

    // Delete a Collection with id
    app.delete(path + '/:id', controller.delete);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}