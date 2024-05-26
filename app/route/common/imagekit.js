module.exports = (app) => {
    const controller = require('../../controller/common/imagekit.js');
    const tokenPath = process.env.CONTEXT_PATH + '/imagekit/token';
    const deleteFilePath = process.env.CONTEXT_PATH + '/imagekit/file';
    const getFilePath = process.env.CONTEXT_PATH + '/imagekit/file';
    const listFiles = process.env.CONTEXT_PATH + '/imagekit/files';
    // Public routes
    app.get(tokenPath, controller.token);
    app.delete(deleteFilePath, controller.deleteFile);
    app.get(getFilePath, controller.getFile);
    app.get(listFiles, controller.listFiles);
}