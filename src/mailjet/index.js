const logger = require('heroku-logger');
const Mailjet = require('node-mailjet');

const {
    MJ_APIKEY_GT_PUBLIC,
    MJ_APIKEY_GT_PRIVATE,
    MJ_VERSION = 'v3.1',
} = process.env;

let mailjet;

const connect = () => {
    logger.info('bouquet/mailjet > connecting', { version: MJ_VERSION });
    mailjet = Mailjet.connect(MJ_APIKEY_GT_PUBLIC, MJ_APIKEY_GT_PRIVATE);
};

// https://stackoverflow.com/questions/286141/remove-blank-attributes-from-an-object-in-javascript
const removeEmpty = obj =>
    Object.keys(obj)
        .filter(k => obj[k] != null) // Remove undef. and null.
        .reduce(
            (newObj, k) =>
                typeof obj[k] === 'object'
                    ? { ...newObj, [k]: removeEmpty(obj[k]) } // Recurse.
                    : { ...newObj, [k]: obj[k] }, // Copy value.
            {}
        );

const send = async ({ to, bcc, data, TemplateID, mock }) => {
    let error;
    if (!mailjet) {
        error = new Error('server.mailjet.mailjet-not-connected');
    } else if (!TemplateID) {
        error = new Error('server.mailjet.templateid-missing');
    }
    if (error) {
        logger.error('bouquet/mailjet > error', error);
        throw error;
    }

    const message = {
        To: [{ Email: to }],
        TemplateID,
        TemplateLanguage: true,
        // The mailJet engine checks for null values, and these should not appear in the Variables.
        // Then you get the error:
        // Property value cannot be null.","ErrorRelatedTo":["gcExpirationDate","status_error"
        Variables: removeEmpty(data),
    };
    if (bcc) {
        message.Bcc = [{ Email: bcc }];
    }
    // CAUTION: If the template refers to a variable, for example:
    // Dear {{var:identity.firstname}},
    // But there is no firstname in identity, then you can send it here,
    // but you will see `blocked` in Mailjet blocked with the error message:
    //  "error in template language".
    // The mail will not be sent in the end
    let email;

    try {
        logger.info('bouquet/mailjet > sending', {
            to,
            bcc,
            data,
            TemplateID,
            mock,
        });
        if (mock) {
            email = { body: 'MOCKED' };
        } else {
            email = await mailjet
                .post('send', { version: MJ_VERSION })
                .request({
                    Messages: [message],
                });
        }
        logger.info('bouquet/mailjet > sent', email.body);
    } catch (error) {
        // https://github.com/mailjet/mailjet-apiv3-nodejs/blob/0a849c36448be225001fcdc3193d17f03d1396a0/mailjet-client.js#L321-L326
        const { response, ...errObject } = error; // strip response to prevent huge logs
        logger.error('bouquet/mailjet > error', errObject);
        throw error;
    }
    // email.body = {
    //     Sent: [
    //         {
    //             Email: 'chris+testmailjet@devotis.nl',
    //             MessageID: '288230378592236213',
    //             MessageUUID: '0a38ceeb-701d-4bd7-90ba-cfa0771da1cc'
    //         }
    //     ]
    // }

    return email.body;
};

module.exports = {
    connect,
    send,
};
