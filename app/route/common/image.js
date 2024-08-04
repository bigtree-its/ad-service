const controller = require("../../controller/common/image");

module.exports = (app) => {
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + "/images";

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
            check('reference').notEmpty().withMessage('Reference is mandatory'),
            check('fileId').notEmpty().withMessage('FileId is mandatory'),
            check('url').notEmpty().withMessage('Url is mandatory '),
        ],
        controller.create);

    // Update a PostalDistrict with id
    app.put(path + '/:id', controller.update);

    // Delete a PostalDistrict with id
    app.delete(path + '/:id', controller.deleteOne);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}