module.exports = (app) => {
    const controller = require('../../controller/common/postcodedistrict');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/postcode-districts';

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
            check('prefix').notEmpty().isLength({ min: 3, max: 4 }).withMessage('prefix is mandatory'),
            check('name').notEmpty().isLength({ min: 3, max: 50 }).withMessage('name is mandatory'),
            check('coverage').notEmpty().isLength({ min: 3 }).withMessage('region is mandatory'),
            check('region').notEmpty().isLength({ min: 3, max: 50 }).withMessage('region is mandatory'),
            check('postTown').notEmpty().isLength({ min: 3, max: 50 }).withMessage('PostTown is mandatory')
        ],
        controller.create);

    // Update a PostalDistrict with id
    app.put(path + '/:id', controller.update);

    // Delete a PostalDistrict with id
    app.delete(path + '/:id', controller.delete);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}