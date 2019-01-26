const { IncomingWebhook } = require('@slack/client');
const log = require('../utils/log');

module.exports.default = async function handler (event, context, callback) {
  try {
    log('Starting slack post');
    log(context);
    log(event.Records[0].s3);
    const s3 = event.Records[0].s3;
    const url = `https://${s3.bucket.name}.s3.eu-west-1.amazonaws.com/${s3.object.key}`;
    const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);
    const result = await webhook.send(url);
    callback(null, {
      statusCode: 200,
      body: result.text,
    });
  } catch (error) {
    log('Error doing the slack post', error);
    return callback(error);
  }
}
