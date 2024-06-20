module.exports = (app) => {
    const controller = require('../../controller/cloudkitchen/cloudkitchen.js');
    const { verifyToken } = require('../../security/security.js');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/cloud-kitchens';

    // Public routes
    // Retrieve all CloudKitchen
    app.get(path, controller.findAll);

    // Retrieve a single CloudKitchen with Id
    app.get(path + '/:id', controller.findOne);

    // Private routes
    // Creates a new CloudKitchen
    app.post(path,
        // verifyToken, 
        [
            check('contact.email').notEmpty().isEmail().withMessage('Contact Email is mandatory'),
            check('name').notEmpty().withMessage('Name is mandatory'),
            check('description').notEmpty().withMessage('Description is mandatory'),
            check('address.postcode').notEmpty().withMessage('Postcode is mandatory'),
            check('contact.person').notEmpty().withMessage('Contact person is mandatory'),
            check('contact.mobile').notEmpty().withMessage('Contact Mobile is mandatory'),
        ],
        controller.create);

    // Update a CloudKitchen with id
    app.put(path + '/:id', controller.update);

    // Delete a CloudKitchen with id
    app.delete(path + '/:id', controller.delete);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}