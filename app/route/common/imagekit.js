module.exports = (app) => {
    const controller = require("../../controller/common/imagekit.js");
    const path = process.env.CONTEXT_PATH + "/imagekit";
    // Public routes
    app.get(path + "/token", controller.token);
    app.delete(path + "/files/:id", controller.deleteFile);
    app.get(path + "/files/:id", controller.getFile);
    app.get(path + "/files", controller.listFiles);
    app.post(path + "/upload", controller.upload);
};