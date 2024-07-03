module.exports = (app) => {
    const controller = require('../../controller/cloudkitchen/review.js');
    const { verifyToken } = require('../../security/security.js');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/reviews';

    // Public routes
    // Retrieve all Review
    app.get(path, controller.findAll);

    // Retrieve a single Review with Id
    app.get(path + '/:id', controller.findOne);

    // Private routes
    // Creates a new Review
    app.post(path,
        // verifyToken, 
        [
            check('title').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Title is mandatory'),
            check('comment').notEmpty().withMessage('Comment is mandatory'),
            check('cloudKitchenId').notEmpty().withMessage('Cloud Kitchen Id is mandatory'),
            check('customer').notEmpty().withMessage('Customer is mandatory'),
            check('rating').notEmpty().isLength({ min: 0, max: 2 }).withMessage('Rating is mandatory'),
            check('order').notEmpty().withMessage('Order is mandatory'),
        ],
        controller.create);

    // Update a Review with id
    app.put(path + '/:id', controller.update);

    // Delete a Review with id
    app.delete(path + '/:id', controller.delete);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}