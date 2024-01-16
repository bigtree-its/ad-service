module.exports = (app) => {
    const controller = require('../controller/cuisine.js');
    const { verifyToken } = require('../security/security.js');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/review';

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
            check('comment').notEmpty().isLength({ min: 3, max: 500 }).withMessage('Comment is mandatory'),
            check('chefId').notEmpty().isLength({ min: 12, max: 30 }).withMessage('Chef Id is mandatory'),
            check('customerName').notEmpty().isLength({ min: 12, max: 50 }).withMessage('Customer Name is mandatory'),
            check('customerEmail').notEmpty().isLength({ min: 12, max: 50 }).withMessage('Customer Email is mandatory'),
            check('overAllRating').notEmpty().isLength({ min: 12, max: 50 }).withMessage('OverAllRating is mandatory'),
            check('orderReference').notEmpty().isLength({ min: 12, max: 50 }).withMessage('Order Reference is mandatory'),
        ],
        controller.create);

    // Update a Review with id
    app.put(path + '/:id', controller.update);

    // Delete a Review with id
    app.delete(path + '/:id', controller.delete);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}