const controller = require("../../controller/common/postcode-district-csv-loader");

module.exports = (app) => {
    const path = process.env.CONTEXT_PATH + '/postcode-district-csv-loader';
    app.get(path, controller.loadCsv);

}