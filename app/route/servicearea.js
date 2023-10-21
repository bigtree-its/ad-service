module.exports = (app) => {
    const controller = require('../controller/servicearea.js');
    const { verifyToken } = require('../security/security.js');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/serviceareas';

    // Public routes
    // Retrieve all LocalArea
    app.get(path, controller.findAll);

    // Lookup
    app.get(path + '/lookup', controller.lookup);

    // Retrieve a single LocalArea with Id
    app.get(path + '/:id', controller.findOne);



    // Private routes
    // Creates a new LocalArea
    app.post(path,
        // verifyToken, 
        [
            check('name').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Name is mandatory'),
            check('city').notEmpty().isLength({ min: 3, max: 250 }).withMessage('City is mandatory')
        ],
        controller.create);

    // Update a LocalArea with id
    app.put(path + '/:id', controller.update);

    // Delete a LocalArea with id
    app.delete(path + '/:id', controller.delete);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}