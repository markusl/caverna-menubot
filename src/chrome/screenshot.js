const Cdp = require('chrome-remote-interface');
const log = require('../utils/log');
const sleep = require('../utils/sleep');

module.exports = async function captureScreenshotOfUrl (url, clip) {
  const LOAD_TIMEOUT = process.env.PAGE_LOAD_TIMEOUT || 1000 * 60

  let loaded = false;

  const loading = async (startTime = Date.now()) => {
    if (!loaded && Date.now() - startTime < LOAD_TIMEOUT) {
      await sleep(50)
      await loading(startTime)
    }
  }

  const [tab] = await Cdp.List()
  console.log('Opened tab', tab);
  const client = await Cdp({ host: '127.0.0.1', target: tab })

  const {
    Network, Page, Runtime, Emulation,
  } = client;

  Network.requestWillBeSent((params) => {
    log('Chrome is sending request for:', params.request.url)
  })

  Page.loadEventFired(() => {
    loaded = true
  });

  try {
    await Promise.all([Network.enable(), Page.enable()]);

    await Emulation.setDeviceMetricsOverride({
      mobile: false,
      deviceScaleFactor: 0,
      scale: 1,
      fitWindow: false,
      width: 1280,
      height: 2000,
    })

    log(`Navigate to ${url}`);
    await Page.navigate({ url });
    await Page.loadEventFired();
    log(`Waiting to load ${url}`);
    await loading();

    const { result: { value: { height } } } = await Runtime.evaluate({
      expression: `(
        () => ({ height: document.body.scrollHeight })
      )();
      `,
      returnByValue: true,
    });

    log(`Page loaded with height ${height}`);

    await Emulation.setDeviceMetricsOverride({
      mobile: false,
      deviceScaleFactor: 0,
      scale: 1,
      fitWindow: false,
      width: 1280,
      height,
    });

    await Emulation.setVisibleSize({ width: 1280, height });

    log(`Capturing the screenshot of ${url}`);
    const screenshot = await Page.captureScreenshot({
      format: 'jpeg',
      clip: clip,
    });
    log('Screenshot captured', screenshot);

    return screenshot.data;
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}
