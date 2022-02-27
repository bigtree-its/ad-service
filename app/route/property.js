module.exports = (app) => {
    const properties = require('../controller/property.js');
    const { verifyToken } = require('../security/security');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/properties';

    // Public routes
    // Retrieve all Property
    app.get(path, properties.findAll);

    // Retrieve featured Property
    app.get(path + '/featured', properties.featured);

    // Retrieve all Property
    app.get(path + '/paginate', properties.paginate);

    // Retrieve a single Property with Id
    app.get(path + '/:id', properties.findOne);

    // Private routes
    // Creates a new Property
    app.post(path,
        // verifyToken, 
        [
            check('title').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Title is mandatory'),
            check('type').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Type is mandatory'),
            check('description').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Description is mandatory'),
            check('consumptionType').notEmpty().isLength({ min: 3, max: 30 }).withMessage('Consumption Type is mandatory'),
            check('address.postcode').notEmpty().isLength({ min: 5, max: 7 }).withMessage('Postcode is mandatory'),
            check('coverPhoto').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Cover Photo is mandatory'),
            check('contact.person').notEmpty().isLength({ min: 3, max: 30 }).withMessage('Contact person is mandatory'),
            check('contact.email').notEmpty().isEmail().withMessage('Contact Email is mandatory'),
            check('contact.telephone').notEmpty().isLength({ min: 3, max: 250 }).withMessage('Contact Telephone is mandatory'),
        ],
        properties.create);

    // Update a Property with id
    app.put(path + '/:id', properties.update);

    // Delete a Property with id
    app.delete(path + '/:id', properties.delete);

    //Delete All -- only for non propertyion and can only be done by an admin
    app.delete(path, properties.deleteEverything);
}