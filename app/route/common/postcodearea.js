const controller = require("../../controller/common/postcodearea");

module.exports = (app) => {
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/postcode-areas';

    // Public routes
    // Retrieve all PostalDistrict
    app.get(path, controller.lookup);

    // Retrieve a single PostalDistrict with Id
    app.get(path + '/:id', controller.findOne);

    // Private routes
    // Creates a new PostalDistrict
    app.post(path,
        // verifyToken, 
        [
            check('prefix').notEmpty().isLength({ min: 1, max: 2 }).withMessage('prefix is mandatory'),
            check('area').notEmpty().withMessage('Area e.g Glasgow is mandatory'),
            check('region').notEmpty().withMessage('Region is mandatory e.g Scotland'),
        ],
        controller.create);

    // Update a PostalDistrict with id
    app.put(path + '/:id', controller.update);

    // Delete a PostalDistrict with id
    app.delete(path + '/:id', controller.delete);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}