const controller = require("../../controller/common/image");
const path = process.env.CONTEXT_PATH + "/images";
const { check } = require('express-validator');

module.exports = (app) => {
    // Public routes
    // Retrieve all ImagekitImage
    app.get(path, controller.lookup);

    // Retrieve a single ImagekitImage with Id
    app.get(path + '/:id', controller.findOne);

    // Private routes
    // Creates a new ImagekitImage
    app.post(path,
        // verifyToken, 
        [
            check('reference').notEmpty().withMessage('Reference is mandatory'),
            check('fileId').notEmpty().withMessage('FileId is mandatory'),
            check('url').notEmpty().withMessage('Url is mandatory '),
        ],
        controller.create);

    // Update a ImagekitImage with id
    app.put(path + '/:id', controller.update);

    // Delete a ImagekitImage with id
    app.delete(path + '/:id', controller.deleteOne);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}