module.exports = (app) => {
    const types = require('../../controller/property/type.js');

    const path = process.env.CONTEXT_PATH + '/property-types';
    // Public routes
    // Retrieve all Type
    app.get(path, types.findAll);

    // Retrieve a single Type with Id
    app.get(path + '/:id', types.findOne);

    // Private routes
    // Creates a new Type
    app.post(path,
        // verifyToken, 
        types.create);

    // Update a Type with id
    app.put(path + '/:id', types.update);

    // Delete a Type with id
    app.delete(path + '/:id', types.delete);

    // Delete All -- only for non production and can only be done by an admin
    app.delete(path, types.deleteAll);
}