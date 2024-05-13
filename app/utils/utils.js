function randomString(length) {
    var chars = '0123456789abcdefghijklmnopqrstuvwxyz';
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
};

function throwError(message, res) {
    var error = {};
    var ref = randomString(6);
    error.reference = randomString(6);
    error.message = message;
    console.error(error)
    return res.status(400).json(error);
};

function buildError(message) {
    var error = {};
    error.reference = randomString(6);
    error.message = message;
    console.error(error)
    return error;
};

function isEmpty(data) {
    if (data === undefined || data === null || data.length === 0) {
        return true;
    }
    return false;
}
module.exports = { randomString, isEmpty, buildError }