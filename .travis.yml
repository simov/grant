
language: node_js

node_js:
  - node
  - 10
  - 8
  - 6
  - 4

jobs:
  include:
    - stage: coverage
      node_js: 8
      script:
        - npm run test:cov
        - cat ./coverage/lcov.info | coveralls

sudo: false
