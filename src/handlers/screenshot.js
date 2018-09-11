const log = require('../utils/log');
const captureScreenshotOfUrl = require('../chrome/screenshot');
const AWS = require('aws-sdk');

module.exports.default = async function handler (event, context, callback) {
  const url = process.env.TARGET_SITE_URL;
  const clip = { x: 215, y: 550, width: 370, height: 620, scale: 1 };

  log('Processing screenshot capture for', url);

  const startTime = Date.now();

  try {
    const data = await captureScreenshotOfUrl(url, clip);
    
    log(`Chromium took ${Date.now() - startTime}ms to load URL and capture screenshot.`);

    const bucket = process.env.TARGET_BUCKET_NAME;
    const s3bucket = new AWS.S3({params: {Bucket: bucket}});
    const params = {
      ACL: 'public-read',
      Key: `menu-${Date.now()}.jpg`,
      Body: Buffer.from(data, 'base64'),
    };
    const result = await s3bucket.upload(params).promise();
    console.log('Screenshot stored to ' + result.Location);
    callback(null, {
      statusCode: 200,
      body: result.Location,
    });
  } catch (error) {
    console.error('Error capturing screenshot for', url, error);
    return callback(error);
  }
}
