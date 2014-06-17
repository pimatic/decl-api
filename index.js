var Q, assert, callActionFromReq, callActionFromReqAndRespond, checkConfig, checkConfigEntry, createExpressRestApi, createSocketIoApi, docs, enhanceWithDefaults, getConfigDefaults, handleBooleanParam, handleNumberParam, handleParamType, normalizeAction, normalizeActions, normalizeParam, normalizeParams, normalizeType, path, sendErrorResponse, sendSuccessResponse, serveClient, stringifyApi, toJson, types, wrapActionResult, _, _socketBindings,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

assert = require('assert');

path = require('path');

Q = require('q');

_ = require('lodash');

types = {
  number: "number",
  string: "string",
  array: "array",
  date: "date",
  object: "object",
  boolean: "boolean"
};

types.any = [types.number, types.boolean, types.string, types.array, types.date, types.object];

normalizeType = function(type) {
  assert(__indexOf.call(_.values(types), type) >= 0);
  return type;
};

normalizeAction = function(actionName, action) {
  assert(typeof actionName === "string");
  assert(typeof action === "object");
  assert(action.description != null);
  if (action.params == null) {
    action.params = {};
  }
  normalizeParams(action.params);
  return action;
};

normalizeParams = function(params) {
  var param, paramName;
  assert(typeof params === "object");
  for (paramName in params) {
    param = params[paramName];
    normalizeParam(paramName, param);
  }
  return params;
};

normalizeParam = function(paramName, param) {
  assert(typeof paramName === "string");
  assert(typeof param === "object");
  assert(param.type != null);
  return param;
};

normalizeActions = function(actions) {
  var action, actionName;
  assert(typeof actions === "object");
  for (actionName in actions) {
    action = actions[actionName];
    normalizeAction(actionName, action);
  }
  return actions;
};

sendSuccessResponse = function(res, data) {
  if (data == null) {
    data = {};
  }
  data.success = true;
  return res.send(200, data);
};

sendErrorResponse = function(res, error) {
  var message, statusCode;
  statusCode = 400;
  message = null;
  if (error instanceof Error) {
    message = error.message;
  } else {
    message = error;
  }
  return res.send(statusCode, {
    success: false,
    message: message
  });
};

checkConfigEntry = function(name, entry, val) {
  switch (entry.type) {
    case 'string':
      if (typeof val !== "string") {
        throw new Error("Expected " + name + " to be a string");
      }
      break;
    case 'number':
      if (typeof val !== "number") {
        throw new Error("Expected " + name + " to be a number");
      }
      break;
    case 'boolean':
      if (typeof val !== "boolean") {
        throw new Error("Expected " + name + " to be a boolean");
      }
      break;
    case 'object':
      if (typeof val !== "object") {
        throw new Error("Expected " + name + " to be a object");
      }
      break;
    case 'array':
      if (!Array.isArray(val)) {
        throw new Error("Expected " + name + " to be a array");
      }
  }
};

checkConfig = function(def, config, warnings) {
  var entry, name, _results;
  if (warnings == null) {
    warnings = [];
  }
  for (name in def) {
    entry = def[name];
    if (config[name] != null) {
      checkConfigEntry(name, entry, config[name]);
    } else if (entry["default"] == null) {
      throw new Error("Missing config entry " + name + ".");
    }
  }
  _results = [];
  for (name in config) {
    if (def[name] == null) {
      _results.push(warnings.push("Unknown config entry with name " + name + "."));
    } else {
      _results.push(void 0);
    }
  }
  return _results;
};

getConfigDefaults = function(def) {
  var defaults, entry, name;
  defaults = {};
  for (name in def) {
    entry = def[name];
    if (entry["default"] != null) {
      defaults[name] = entry["default"];
    }
  }
  return defaults;
};

enhanceWithDefaults = function(def, config) {
  var defaults;
  defaults = getConfigDefaults(def);
  config.__proto__ = defaults;
  return config;
};

handleParamType = function(paramName, param, value) {
  var prop, propName, _ref;
  switch (param.type) {
    case "boolean":
      value = handleBooleanParam(paramName, param, value);
      break;
    case "number":
      value = handleNumberParam(paramName, param, value);
      break;
    case "object":
      if (typeof param !== "object") {
        throw new Error("Exprected " + paramName + " to be a object, was: " + value);
      }
      if (param.properties != null) {
        _ref = param.properties;
        for (propName in _ref) {
          prop = _ref[propName];
          if (value[propName] != null) {
            value[propName] = handleParamType(propName, prop, value[propName]);
          } else {
            if (prop.optional == null) {
              throw new Error("Expected " + paramName + " to have an property " + propName + ".");
            }
          }
        }
      }
  }
  return value;
};

handleBooleanParam = function(paramName, param, value) {
  if (typeof value === "string") {
    if (value !== "true" && value !== "false") {
      throw new Error("Exprected " + paramName + " to be boolean, was: " + value);
    } else {
      value = value === "true";
    }
  }
  return value;
};

handleNumberParam = function(paramName, param, value) {
  var numValue;
  if (typeof value === "string") {
    numValue = parseFloat(value);
    if (isNaN(numValue)) {
      throw new Error("Exprected " + paramName + " to be boolean, was: " + value);
    } else {
      value = numValue;
    }
  }
  return value;
};

callActionFromReq = function(actionName, action, binding, req) {
  var p, paramName, paramValue, params, _ref;
  assert(typeof binding[actionName] === "function");
  params = [];
  _ref = action.params;
  for (paramName in _ref) {
    p = _ref[paramName];
    paramValue = null;
    if (req.params[paramName] != null) {
      paramValue = req.params[paramName];
    } else if (req.query[paramName] != null) {
      paramValue = req.query[paramName];
    } else if (req.body[paramName] != null) {
      paramValue = req.body[paramName];
    } else if (!p.optional) {
      throw new Error("expected param: " + paramName);
    }
    if (paramValue != null) {
      params.push(handleParamType(paramName, p, paramValue));
    }
  }
  return Q.fcall((function(_this) {
    return function() {
      return binding[actionName].apply(binding, params);
    };
  })(this));
};

toJson = function(result) {
  var e, i;
  if (Array.isArray(result)) {
    return (function() {
      var _i, _len, _results;
      _results = [];
      for (i = _i = 0, _len = result.length; _i < _len; i = ++_i) {
        e = result[i];
        _results.push(toJson(e));
      }
      return _results;
    })();
  } else if (typeof result === "object") {
    if (result.toJson != null) {
      return result.toJson();
    }
  }
  return result;
};

wrapActionResult = function(action, result) {
  var key, response, resultName;
  assert(typeof action === "object");
  if (action.result) {
    resultName = ((function() {
      var _results;
      _results = [];
      for (key in action.result) {
        _results.push(key);
      }
      return _results;
    })())[0];
    if (action.result[resultName].toJson != null) {
      result = toJson(result);
    }
  } else {
    resultName = "result";
  }
  response = {};
  response[resultName] = result;
  return response;
};

callActionFromReqAndRespond = function(actionName, action, binding, req, res, onError) {
  if (onError == null) {
    onError = null;
  }
  assert(typeof binding[actionName] === "function");
  return Q.fcall((function(_this) {
    return function() {
      return callActionFromReq(actionName, action, binding, req);
    };
  })(this)).then(function(result) {
    var response;
    response = wrapActionResult(action, result);
    return sendSuccessResponse(res, response);
  })["catch"](function(error) {
    if (onError != null) {
      onError(error);
    }
    return sendErrorResponse(res, error);
  }).done();
};

createExpressRestApi = function(app, actions, binding, onError) {
  var action, actionName, _fn;
  if (onError == null) {
    onError = null;
  }
  _fn = (function(_this) {
    return function(actionName, action) {
      var type, url;
      if (action.rest != null) {
        type = (action.rest.type || 'get').toLowerCase();
        url = action.rest.url;
        return app[type](url, function(req, res, next) {
          return callActionFromReqAndRespond(actionName, action, binding, req, res, onError);
        });
      }
    };
  })(this);
  for (actionName in actions) {
    action = actions[actionName];
    _fn(actionName, action);
  }
};

_socketBindings = null;

createSocketIoApi = (function(_this) {
  return function(socket, actionsAndBindings, onError) {
    if (onError == null) {
      onError = null;
    }
    return socket.on('call', function(call) {
      var actions, binding, foundBinding, _fn, _i, _len, _ref;
      assert((call.action != null) && typeof call.action === "string");
      assert((call.params != null) && Array.isArray(call.params));
      assert(call.id != null ? typeof call.id === "string" || typeof call.id === "number" : true);
      foundBinding = false;
      _fn = (function(_this) {
        return function(actions, binding) {
          var action, result;
          action = actions[call.action];
          if (action != null) {
            foundBinding = true;
            result = binding[call.action].apply(binding, call.params);
            return Q(result).then(function(result) {
              var response;
              response = wrapActionResult(action, result);
              return socket.emit('callResult', {
                id: call.id,
                success: true,
                result: response
              });
            })["catch"](function(error) {
              if (onError != null) {
                onError(error);
              }
              return socket.emit('callResult', {
                id: call.id,
                success: false
              });
            });
          }
        };
      })(this);
      for (_i = 0, _len = actionsAndBindings.length; _i < _len; _i++) {
        _ref = actionsAndBindings[_i], actions = _ref[0], binding = _ref[1];
        _fn(actions, binding);
      }
      if (!foundBinding) {
        if (onError != null) {
          return onError(new Error("Could not find action \"" + call.action + "\"."));
        }
      }
    });
  };
})(this);

serveClient = function(req, res) {
  return res.sendfile(path.resolve(__dirname, 'clients/decl-api-client.js'));
};

stringifyApi = function(api) {
  return JSON.stringify(api, null, " ");
};

docs = function() {
  return require('./docs.js');
};

module.exports = {
  types: types,
  normalizeActions: normalizeActions,
  callActionFromReq: callActionFromReq,
  wrapActionResult: wrapActionResult,
  createExpressRestApi: createExpressRestApi,
  callActionFromReqAndRespond: callActionFromReqAndRespond,
  sendErrorResponse: sendErrorResponse,
  sendSuccessResponse: sendSuccessResponse,
  serveClient: serveClient,
  stringifyApi: stringifyApi,
  docs: docs,
  checkConfig: checkConfig,
  getConfigDefaults: getConfigDefaults,
  enhanceWithDefaults: enhanceWithDefaults,
  createSocketIoApi: createSocketIoApi
};
