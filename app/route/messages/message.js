module.exports = (app) => {
    const controller = require('../../controller/messages/message.js');
    const { verifyToken } = require('../../security/security.js');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/messages';

    // Public routes
    // Retrieve all Dish
    app.get(path, controller.lookup);

    // Retrieve a single Dish with Id
    app.get(path + '/:id', controller.findOne);

    // Private routes
    // Creates a new Dish
    app.post(path,
        // verifyToken, 
        [
            check('reason').notEmpty().withMessage('reason is mandatory'),
            check('message').notEmpty().withMessage('message is mandatory'),
            check('customer').notEmpty().withMessage('customer is mandatory')
        ],
        controller.create);

    // Update a Dish with id
    app.put(path + '/:id', controller.update);

    // Delete a Dish with id
    app.delete(path + '/:id', controller.deleteOne);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}