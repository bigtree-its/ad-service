module.exports = (app) => {
    const controller = require('../../controller/common/imagekit.js');
    const tokenPath = process.env.CONTEXT_PATH + '/imagekit-token';
    const deleteFilePath = process.env.CONTEXT_PATH + '/imagekit-delete-file';
    // Public routes
    app.get(tokenPath, controller.token);
    app.delete(deleteFilePath, controller.delete);
}