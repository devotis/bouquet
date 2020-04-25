const valueSafeForSet = value =>
    value == null // of undefined dus
        ? ''
        : typeof value === 'object'
        ? JSON.stringify(value)
        : value;

module.exports = {
    valueSafeForSet,
};
