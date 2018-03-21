import log from '../utils/log';
import Slack from 'slack';

export default async function handler (event, context, callback) {
  try {
    log('Starting slack post');
    log(context);
    log(event.Records[0].s3);
    const s3 = event.Records[0].s3;
    const url = 'https://' + s3.bucket.name + '.s3.eu-west-1.amazonaws.com/' + s3.object.key;

    const token = process.env.SLACK_TOKEN;
    const channel = process.env.TARGET_SLACK_CHANNEL;
    Slack.chat.postMessage({token: token, channel: channel, text: url });
    callback(null, {
      statusCode: 200,
      body: context
    });
  } catch (error) {
    console.error('Error doing the slack post', error)
    return callback(error)
  }
}
