module.exports = (app) => {
    const carousels = require('../controller/carousel');
    const { verifyToken } = require('../security/security');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/carousels';

    // Retrieve all carousel
    app.get(path, carousels.findAll);

    // Retrieve a single carousel with Id
    app.get(path + '/:id', carousels.findOne);

    // Create a new carousel
    app.post(path,
        // verifyToken, 
        [
            check('property').exists().isMongoId().withMessage('Property is not valid'),
            check('title').notEmpty().isLength({ min: 2, max: 20 }),
            check('active').notEmpty().isBoolean().withMessage('Active field not valid'),
            check('coming').notEmpty().isBoolean().withMessage('Coming field not valid')
        ],
        carousels.create);

    // Update a carousel with id
    app.put(path + '/:id',
        // verifyToken, 
        [
            check('product').exists().isMongoId().withMessage('Product is not valid')
        ],
        carousels.update);

    // Delete a carousel with id
    app.delete(path + '/:id',
        // verifyToken,
        carousels.delete);
}