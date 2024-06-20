module.exports = (app) => {
    const controller = require('../../controller/cloudkitchen/calendar.js');
    const { verifyToken } = require('../../security/security.js');
    const { check } = require('express-validator');

    const path = process.env.CONTEXT_PATH + '/calendars';
    let date_ob = new Date();
    console.log(`Todays Date is ${date_ob}`);
    // Public routes
    // Retrieve all Calendar
    app.get(path, controller.findAll);

    // Retrieve a single Calendar with Id
    app.get(path + '/:id', controller.findOne);

    // Private routes
    // Creates a new Calendar
    app.post(path,
        // verifyToken, 
        [
            check('foods').notEmpty().withMessage('Foods must not be empty'),
            check('date').custom((date_ob, { req }) => {
                if (date_ob > req.body.date) {
                    throw new Error('Date must be a future date');
                }
                // Indicates the success of this synchronous custom validator
                return true;
            })
        ],
        controller.create);

    // Update a Calendar with id
    app.put(path + '/:id', controller.update);

    // Delete a Calendar with id
    app.delete(path + '/:id', controller.delete);

    //Delete All -- only for non production and can only be done by an admin
    app.delete(path, controller.deleteEverything);
}