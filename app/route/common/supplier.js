module.exports = (app) => {
    const controller = require('../../controller/common/supplier');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/suppliers';

    // Public routes
    // Retrieve all Supplier
    app.get(path, controller.findAll);

    // Retrieve a single Supplier with Id
    app.get(path + '/:id', controller.findOne);

    // Private routes
    // Creates a new Supplier
    app.post(path,
        // verifyToken, 
        [
            check('name').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Name is mandatory'),
            check('email').notEmpty().isLength({ min: 10, max: 250 }).withMessage('Email is mandatory')
        ],
        controller.create);

    // Update a Supplier with id
    app.put(path + '/:id', controller.update);

    // Delete a Supplier with id
    app.delete(path + '/:id', controller.delete);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}