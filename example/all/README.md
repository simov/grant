
# All Providers Example


## Install

```bash
$ cd examples/all
$ npm install
```


## Configure

You have to create `config/credentials.json` file that contains all of your OAuth application credentials

```js
{
  ...
  "facebook": {
    "key": "[APP_ID]",
    "secret": "[APP_SECRET]"
  },
  "twitter": {
    "key": "[CONSUMER_KEY]",
    "secret": "[CONSUMER_SECRET]"
  }
  ...
}
```


## Run the App

For Express execute

```bash
$ node express.js
```

For Koa execute (NodeJS 11 at minimum)

```bash
$ node --harmony koa.js
```
