#!/bin/bash

# Grant uses language features available in Node >= 8
# Grant is transpiled to support versions of Node >= 4
# The transpiled version, however, is used only on Node 4 and 6
# Node >= 8 uses the raw source files instead

# prepublish
rm -rf build/ && mkdir build

# fix for Node v4
rm -rf node_modules/core-js
npm i core-js@2.6.10 --no-save

# alias
babel=node_modules/.bin/babel

# transpile
$babel lib/consumer --out-dir build/lib/consumer
# do not transpile
# hapi17 and koa2 depend on Node >= 8
# koa1 works natively on Node >= 4
cp lib/consumer/koa.js build/lib/consumer/
cp lib/consumer/koa2.js build/lib/consumer/
cp lib/consumer/hapi17.js build/lib/consumer/

# transpile
$babel lib/flow --out-dir build/lib/flow
$babel lib/*.js --out-dir build
$babel test --out-dir build/test
$babel *.js --out-dir build

# copy
cp -r config/ build/
cp package.json build/
