function randomString(length) {
    var chars = '0123456789abcdefghijklmnopqrstuvwxyz';
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
};

function isEmpty(data) {
    if (data === undefined || data === null || data.length === 0) {
        return true;
    }
    return false;
}
module.exports = { randomString, isEmpty }