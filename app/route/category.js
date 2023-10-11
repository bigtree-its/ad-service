module.exports = (app) => {
    const controller = require('../controller/category.js');
    const { verifyToken } = require('../security/security.js');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/category';

    // Public routes
    // Retrieve all Category
    app.get(path, controller.findAll);

    // Retrieve a single Category with Id
    app.get(path + '/:id', controller.findOne);

    // Private routes
    // Creates a new Category
    app.post(path,
        // verifyToken, 
        [
            check('name').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Name is mandatory')
        ],
        controller.create);

    // Update a Category with id
    app.put(path + '/:id', controller.update);

    // Delete a Category with id
    app.delete(path + '/:id', controller.delete);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}