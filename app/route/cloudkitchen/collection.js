module.exports = (app) => {
    const controller = require('../../controller/cloudkitchen/collection.js');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/collections';

    // Public routes
    // Retrieve all Collection
    app.get(path, controller.lookup);

    // Retrieve a single Collection with Id
    app.get(path + '/:id', controller.findOne);

    // Private routes
    // Creates a new Collection
    app.post(path,
        // verifyToken, 
        [
            check('name').notEmpty().withMessage('Name is mandatory'),
            check('cloudKitchenId').notEmpty().withMessage('CloudKitchenId is mandatory')
        ],
        controller.create);

    // Update a Collection with id
    app.put(path + '/:id', controller.update);

    // Delete a Collection with id
    app.delete(path + '/:id', controller.deleteOne);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}