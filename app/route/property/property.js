module.exports = (app) => {
    const controller = require('../../controller/property/property.js');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/properties';

    // Public routes
    // Retrieve all Property
    app.get(path, controller.findAll);

    // Retrieve featured Property
    app.get(path + '/featured', controller.featured);

    // Retrieve all Property
    app.get(path + '/paginate', controller.paginate);

    // Retrieve a single Property with Id
    app.get(path + '/:id', controller.findOne);

    // Private routes
    // Creates a new Property
    app.post(path,
        // verifyToken, 
        [
            check('title').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Title is mandatory'),
            check('propertyType').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Type is mandatory'),
            check('description').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Description is mandatory'),
            check('consumptionType').notEmpty().isLength({ min: 3, max: 30 }).withMessage('Consumption Type is mandatory'),
            check('address.postcode').notEmpty().isLength({ min: 5, max: 7 }).withMessage('Postcode is mandatory'),
            // check('image').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Cover Photo is mandatory'),
            // check('contact.person').notEmpty().isLength({ min: 3, max: 30 }).withMessage('Contact person is mandatory'),
            check('adOwner.email').notEmpty().isEmail().withMessage('Contact Email is mandatory'),
            // check('contact.telephone').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Contact Telephone is mandatory'),
        ],
        controller.create);

    // Update a Property with id
    app.put(path + '/:id', controller.update);

    // Delete a Property with id
    app.delete(path + '/:id', controller.delete);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}