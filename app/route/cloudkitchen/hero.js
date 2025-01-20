module.exports = (app) => {
    const controller = require('../../controller/cloudkitchen/hero.js');
    const { verifyToken } = require('../../security/security.js');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/heros';

    // Public routes
    // Retrieve all Hero
    app.get(path, controller.lookup);

    // Retrieve a single Hero with Id
    app.get(path + '/:id', controller.findOne);

    // Private routes
    // Creates a new Hero
    app.post(path,
        // verifyToken, 
        [
            check('name').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Name is mandatory'),
            check('image').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Image is mandatory')
        ],
        controller.create);

    // Update a Hero with id
    app.put(path + '/:id', controller.update);

    // Delete a Hero with id
    app.delete(path + '/:id', controller.deleteOne);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}