module.exports = (app) => {
    const controller = require('../../controller/cloudkitchen/dish.js');
    const { verifyToken } = require('../../security/security.js');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/dishes';

    // Public routes
    // Retrieve all Dish
    app.get(path, controller.findAll);

    // Retrieve a single Dish with Id
    app.get(path + '/:id', controller.findOne);

    // Private routes
    // Creates a new Dish
    app.post(path,
        // verifyToken, 
        [
            check('name').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Name is mandatory')
        ],
        controller.create);

    // Update a Dish with id
    app.put(path + '/:id', controller.update);

    // Delete a Dish with id
    app.delete(path + '/:id', controller.delete);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}