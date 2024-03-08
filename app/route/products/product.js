module.exports = (app) => {
    const controller = require('../../controller/products/product.js');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/products';

    // Public routes
    // Retrieve all Product
    app.get(path, controller.lookup);

    // Retrieve a single Product with Id
    app.get(path + '/:id', controller.findOne);

    // Private routes
    // Creates a new Product
    app.post(path,
        // verifyToken, 
        [
            check('name').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Name is mandatory'),
            check('group').notEmpty().withMessage('group is mandatory'),
            check('price').notEmpty().withMessage('Price is mandatory'),
            check('supplier').notEmpty().withMessage('Supplier is mandatory'),
        ],
        controller.create);

    // Update a Product with id
    app.put(path + '/:id', controller.update);

    // Delete a Product with id
    app.delete(path + '/:id', controller.delete);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}