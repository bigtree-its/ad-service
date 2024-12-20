const multer = require("multer");
const path = process.env.CONTEXT_PATH + "/cloudflare";
const CloudflareImageApiClient = require("../../controller/common/cloudflare-image-api-client.js");
const CloudflareImageController = require("../../controller/common/cloudflare-image.js");

const memStorage = multer.memoryStorage();
const uploadToMem = multer({ storage: memStorage });

// const upload = multer({ dest: "uploads/" });
module.exports = (app) => {
    // Public routes
    // Upload To Cloudflare
    app.post(path + "/upload_images", uploadToMem.array("files", 5), CloudflareImageApiClient.uploadImage);
    app.get(path + "/images", CloudflareImageController.lookup);
    //Delete All -- only for non production and can only be done by an admin
    app.delete(path + "/images", CloudflareImageController.deleteEverything);
};
