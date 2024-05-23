module.exports = (app) => {
    const controller = require('../../controller/common/imagekit_auth.js');
    const path = process.env.CONTEXT_PATH + '/imagekit-token';
    // Public routes
    app.post(path, controller.token);
}