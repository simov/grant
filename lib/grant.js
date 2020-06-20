
var {compose} = require('./util')
var {defaults, connect, callback} = require('./request')
var {data, transport} = require('./response')
var _config = require('./config')


module.exports = ({config, request, state, extend}) => {
  config = _config(config)

  if (!extend) {
    extend = [require('./profile')]
  }

  var pipe = compose(
    defaults(config),

    ({provider, input, input:{params}}) => params.override !== 'callback'
      ? connect({request})({provider, input})
      : compose(
          callback({request})({provider, input}),
          data,
          extend ? compose(...extend.map((fn) => fn({request, state}))) : (args) => ({...args})
        )({provider, input}),

    transport,
  )

  pipe.config = config
  return pipe
}
