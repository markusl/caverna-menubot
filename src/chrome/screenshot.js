const Cdp = require('chrome-remote-interface');
const log = require('../utils/log');
const sleep = require('../utils/sleep');

module.exports = async function captureScreenshotOfUrl (url, clip, mobile = false) {
  const LOAD_TIMEOUT = process.env.PAGE_LOAD_TIMEOUT || 1000 * 60

  let result
  let loaded = false

  const loading = async (startTime = Date.now()) => {
    if (!loaded && Date.now() - startTime < LOAD_TIMEOUT) {
      await sleep(100)
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

    if (mobile) {
      await Network.setUserAgentOverride({
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 10_0_1 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/14A403 Safari/602.1',
      })
    }

    await Emulation.setDeviceMetricsOverride({
      mobile: !!mobile,
      deviceScaleFactor: 0,
      scale: 1, // mobile ? 2 : 1,
      fitWindow: false,
      width: mobile ? 375 : 1280,
      height: 0,
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
    })

    await Emulation.setDeviceMetricsOverride({
      mobile: !!mobile,
      deviceScaleFactor: 0,
      scale: 1, // mobile ? 2 : 1,
      fitWindow: false,
      width: mobile ? 375 : 1280,
      height,
    })

    log(`Capturing the screenshot of ${url}`);
    const screenshot = await Page.captureScreenshot({
      format: 'png',
      clip: clip,
    });
    log('Screenshot captured', screenshot);

    result = screenshot.data;
  } catch (error) {
    console.error(error);
  }

  await client.close();

  return result;
}
