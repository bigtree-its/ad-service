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

/**
 * Utility that waits for @predicate function to return truthy, testing at @interval until @timeout is reached.
 *
 * Example: await until(() => spy.called);
 *
 * @param {Function} predicate
 * @param {Number} interval
 * @param {Number} timeout
 *
 * @return {Promise}
 */
async function until(predicate, interval = 500, timeout = 30 * 1000) {
    const start = Date.now();

    let done = false;
    do {
        if (predicate()) {
            done = true;
        } else if (Date.now() > (start + timeout)) {
            throw new Error(`Timed out waiting for predicate to return true after ${timeout}ms.`);
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
    } while (done !== true);
}

module.exports = { randomString, isEmpty, buildError, until }