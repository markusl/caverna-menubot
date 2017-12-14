import log from '../utils/log';
import screenshot from '../chrome/screenshot';

const AWS = require('aws-sdk');

export default async function handler (event, context, callback) {
  const url = 'http://caverna.fi/lounas/';
  const mobile = false;
  const clip = { x: 215, y: 480, width: 860, height: 920, scale: 1 };

  log('Processing screenshot capture for', url)

  const startTime = Date.now()

  try {
    let data = await screenshot(url, clip, mobile)
    
    log(`Chromium took ${Date.now() - startTime}ms to load URL and capture screenshot.`)

    const bucket = process.env.TARGET_BUCKET_NAME;
    const s3bucket = new AWS.S3({params: {Bucket: bucket}});
    const params = {
      ACL: 'public-read',
      Key: `menu-${Date.now()}.png`,
      Body: Buffer.from(data, 'base64'),
    };
    const result = await s3bucket.upload(params).promise();
    console.log('Screenshot stored to ' + result.Location);
    callback(null, {
      statusCode: 200,
      body: result.Location,
    });
  } catch (error) {
    console.error('Error capturing screenshot for', url, error)
    return callback(error)
  }
}
