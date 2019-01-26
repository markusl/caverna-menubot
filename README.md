# Caverna menu slack bot

A slack bot that uses serverless chrome in AWS lambda to fetch a screenshot of Caverna menu and posts it to a slack channel.

First version was adapted from Marco Lüthy's template <https://github.com/adieuadieu/serverless-chrome/tree/master/examples/serverless-framework/aws>

## Deployment

First, create file `slack.yml` that contains a webhook url.

```yaml
WebhookUrl: https://hooks.slack.com/services/XXXXYYYYZZZZ
```

Once Credentials are set up, to deploy the full service run:

```bash
npm run deploy
```

The service will now run daily 10.30 Finnish time and deliver daily menu.
