module.exports = (app) => {
    const controller = require('../../controller/ad/adEnquiry');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/ad-enquiries';

    // Public routes
    // Retrieve all
    app.get(path, controller.findAll);

    // Retrieve a single with Id
    app.get(path + '/:id', controller.findOne);

    // Private routes
    // Creates a new
    app.post(path,
        // verifyToken, 
        [
            check('reference').notEmpty().withMessage('reference is mandatory'),
            check('category').notEmpty().withMessage('Category is mandatory'),
            check('adOwner').notEmpty().withMessage('AdOwner is mandatory'),
            check('customer').notEmpty().withMessage('Customer is mandatory'),
        ],
        controller.create);

    // Update a  with id
    app.put(path + '/:id', controller.update);

    // Delete a  with id
    app.delete(path + '/:id', controller.delete);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}