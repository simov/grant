
var {compose} = require('./util')
var request = require('./request')
var response = require('./response')
var _config = require('./config')


module.exports = ({config}) => {
  config = _config(config)

  var pipe = compose(
    request.defaults(config),

    ({provider, input, input:{params}}) => params.override !== 'callback'
      ? request.connect({provider, input})
      : compose(
        request.callback({provider, input}),
        response.data
      )({provider, input}),

    response.transport,
  )

  pipe.config = config
  return pipe
}
