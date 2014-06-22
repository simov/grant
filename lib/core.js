// jshint laxbreak: true

var query = require('querystring');

/**
  Gatekeeper

  Keeps relation to server, step, and session data outside the realm of call systems.

  @author Nijiko Yonskai
  @copyright Mashape, 2013, MIT License
*/
module.exports = exports = function (opts) {
  var $this = this;

  // Setup invocation check
  this.invoked = true;

  // Protected Server Relations
  var request = opts.req;
  var response = opts.res;
  var server = { req: request, res: response };
  var session;

  // Handle errors and exceptions, the clean way.
  this.handleException = function (message) {
    if (message) log.info(message); else log.info('Unknown error!');

    if (!data.done.callback || data.done.callback == "oob") return response.json(500, {
      error: message
    });

    return response.redirect(data.done.callback + '?' + query.stringify({ error: message }));
  };

  // So we don't have to do re-creation
  this.refreshData = function (step) {
    // Protected resource
    session = request.session.data;

    // Public data & extension
    $this.step = parseInt(step, 10);
    $this.data = JSON.parse(JSON.stringify(session));
    $this.plugin = exports.requirePlugin(data.auth);

    if (!$this.data)
      return $this.handleException('Missing session data.');

    if (!$this.step > $this.plugin.steps)
      return $this.handleException('All steps have been completed, authentication should be done.');

    session.step = $this.step;
  };

  this.generateNext = function () {
    var handle = {
      success: function (data) {
        if (!$this.data.done.callback || $this.data.done.callback == "oob")
          return response.json(data);

        return response.redirect($this.data.done.callback + '?' + query.stringify(data));
      },

      next: function () {
        return $this.invokeStep($this.step + 1);
      }
    };

    return function () {
      var args = Array.prototype.slice.call(arguments), info = {};
      var token_based = (args.length > 3);

      // Determine response information
      info.options = $this.data;
      info.error = args[0];
      info[token_based ? 'token' : 'data'] = args[1];
      info[token_based ? 'secret' : 'response'] = args[2];

      if (token_based)
        info.results = args[3];

      return $this.plugin.step[$this.step].next(server, info, (
        ($this.step + 1) > $this.plugin.steps ? handle.success : handle.next
      ));
    };
  };

  this.invokeStep = function (step) {
    $this.refreshData(step);

    if ($this.plugin.step[$this.step].next)
      $this.data.next = $this.generateNext();

    return $this.plugin.step[$this.step].invoke($this.data, server);
  };

  return this;
};

exports.generatePluginPath = function (opts) {
  return {
    flow: opts.flow
      ? '_' + opts.flow
      : '',

    version: opts.version && typeof opts.version === 'number'
      ? '_' + opts.version
      : '',

    leg: opts.leg && typeof opts.leg === 'number'
      ? '_' + opts.leg + '-legged'
      : ''
  };
};

exports.requirePlugin = function (opts) {
  var path = exports.generatePluginPath(opts);
  return require('../plugins/' + opts.type.toLowerCase() + path.flow + path.version + path.leg + '.js');
};
