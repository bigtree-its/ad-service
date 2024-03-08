module.exports = (app) => {
    const controller = require('../../controller/products/group.js');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/groups';

    // Public routes
    // Retrieve all Group
    app.get(path, controller.lookup);

    // Retrieve a single Group with Id
    app.get(path + '/:id', controller.findOne);

    // Private routes
    // Creates a new Group
    app.post(path,
        // verifyToken, 
        [
            check('name').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Name is mandatory')
        ],
        controller.create);

    // Update a Group with id
    app.put(path + '/:id', controller.update);

    // Delete a Group with id
    app.delete(path + '/:id', controller.delete);

    //Delete All -- only for non Groupion and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}