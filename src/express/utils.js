const getRemoteAddress = (req) => {
    return (
        (req.headers && req.headers['x-forwarded-for']) ||
        req.ip ||
        req._remoteAddress ||
        (req.connection && req.connection.remoteAddress) ||
        undefined
    );
};

module.exports = {
    getRemoteAddress,
};
