module.exports = (app) => {
    const controller = require('../controller/localchef.js');
    const { verifyToken } = require('../security/security');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/localchefs';

    // Public routes
    // Retrieve all LocalChef
    app.get(path, controller.findAll);

    // Retrieve a single LocalChef with Id
    app.get(path + '/:id', controller.findOne);

    // Private routes
    // Creates a new LocalChef
    app.post(path,
        // verifyToken, 
        [
            check('name').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Name is mandatory'),
            check('description').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Description is mandatory'),
            check('address.postcode').notEmpty().isLength({ min: 5, max: 7 }).withMessage('Postcode is mandatory'),
            check('coverPhoto').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Cover Photo is mandatory'),
            check('contact.person').notEmpty().isLength({ min: 3, max: 30 }).withMessage('Contact person is mandatory'),
            check('contact.email').notEmpty().isEmail().withMessage('Contact Email is mandatory'),
            check('contact.telephone').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Contact Telephone is mandatory'),
        ],
        controller.create);

    // Update a LocalChef with id
    app.put(path + '/:id', controller.update);

    // Delete a LocalChef with id
    app.delete(path + '/:id', controller.delete);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}