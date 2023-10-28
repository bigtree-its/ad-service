module.exports = (app) => {
    const controller = require('../controller/food.js');
    const { verifyToken } = require('../security/security');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/foods';

    // Public routes
    // Retrieve all Food
    app.get(path, controller.findAll);

    // Retrieve a single Food with Id
    app.get(path + '/:id', controller.findOne);

    // Private routes
    // Creates a new Food
    app.post(path,
        // verifyToken, 
        [
            check('name').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Name is mandatory'),
            check('group').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Group is mandatory'),
            check('price').notEmpty().withMessage('Price is mandatory'),
            check('chefId').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Chef is mandatory')
        ],
        controller.create);

    // Update a Food with id
    app.put(path + '/:id', controller.update);

    // Delete a Food with id
    app.delete(path + '/:id', controller.delete);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}