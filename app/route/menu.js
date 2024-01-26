module.exports = (app) => {
    const controller = require('../controller/menus.js');
    const { verifyToken } = require('../security/security.js');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/menus';

    // Public routes
    // Retrieve all Menu
    app.get(path, controller.lookup);

    // Retrieve a single Menu with Id
    app.get(path + '/:id', controller.findOne);

    // Private routes
    // Creates a new Menu
    app.post(path,
        // verifyToken, 
        [
            check('name').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Name is mandatory'),
            check('collectionId').notEmpty().withMessage('Collection is mandatory'),
            check('price').notEmpty().withMessage('Price is mandatory'),
            check('chefId').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Chef is mandatory')
        ],
        controller.create);

    // Update a Menu with id
    app.put(path + '/:id', controller.update);

    // Delete a Menu with id
    app.delete(path + '/:id', controller.delete);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}