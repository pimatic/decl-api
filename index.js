var Promise, _, _socketBindings, assert, callActionFromReq, callActionFromReqAndRespond, callActionFromSocket, callActionFromSocketAndRespond, checkConfig, checkConfigEntry, createExpressRestApi, createSocketIoApi, docs, enhanceJsonSchemaWithDefaults, getConfigDefaults, handleBooleanParam, handleNumberParam, handleParamType, normalizeAction, normalizeActions, normalizeParam, normalizeParams, normalizeType, path, sendErrorResponse, sendResponse, sendSuccessResponse, serveClient, stringifyApi, toJson, types, wrapActionResult,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

assert = require('assert');

path = require('path');

Promise = require('bluebird');

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
  assert(indexOf.call(_.values(types), type) >= 0);
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

sendResponse = function(res, statusCode, data) {
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", 0);
  return res.status(statusCode).send(data);
};

sendSuccessResponse = function(res, data) {
  if (data == null) {
    data = {};
  }
  data.success = true;
  return sendResponse(res, 200, data);
};

sendErrorResponse = function(res, error, statusCode) {
  var message;
  if (statusCode == null) {
    statusCode = 400;
  }
  message = null;
  if (error instanceof Error) {
    message = error.message;
  } else {
    message = error;
  }
  return sendResponse(res, statusCode, {
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
  var entry, name, results;
  if (warnings == null) {
    warnings = [];
  }
  for (name in def) {
    entry = def[name];
    if (config[name] != null) {
      checkConfigEntry(name, entry, config[name]);
    } else if ((entry["default"] == null) && !(entry.required === false)) {
      throw new Error("Missing config entry " + name + ".");
    }
  }
  results = [];
  for (name in config) {
    if (def[name] == null) {
      results.push(warnings.push("Unknown config entry with name " + name + "."));
    } else {
      results.push(void 0);
    }
  }
  return results;
};

getConfigDefaults = function(def, includeObjects) {
  var defaults, entry, name;
  if (includeObjects == null) {
    includeObjects = true;
  }
  defaults = {};
  for (name in def) {
    entry = def[name];
    if (entry["default"] != null) {
      defaults[name] = entry["default"];
    } else if (includeObjects && entry.type === "object" && (entry.properties != null)) {
      defaults[name] = getConfigDefaults(entry.properties);
    }
  }
  return defaults;
};

enhanceJsonSchemaWithDefaults = function(def, config) {
  var defaults, entry, name, ref;
  assert(def.type === "object", "Expected def to be a config schema with type \"object\"");
  assert(typeof def.properties === "object");
  defaults = getConfigDefaults(def.properties, false);
  ref = def.properties;
  for (name in ref) {
    entry = ref[name];
    if (entry.type === "object" && (entry.properties != null)) {
      config[name] = enhanceJsonSchemaWithDefaults(entry, config[name] || {});
    } else if ((config[name] == null) && (defaults[name] != null) && Array.isArray(defaults[name])) {
      config[name] = _.cloneDeep(defaults[name]);
    }
  }
  config.__proto__ = defaults;
  return config;
};

handleParamType = function(paramName, param, value) {
  var prop, propName, ref;
  switch (param.type) {
    case "boolean":
      value = handleBooleanParam(paramName, param, value);
      break;
    case "number":
      value = handleNumberParam(paramName, param, value);
      break;
    case "object":
      if (typeof param !== "object") {
        throw new Error("Expected " + paramName + " to be a object, was: " + value);
      }
      if (param.properties != null) {
        ref = param.properties;
        for (propName in ref) {
          prop = ref[propName];
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
      throw new Error("Expected " + paramName + " to be boolean, was: " + value);
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
      throw new Error("Expected " + paramName + " to be boolean, was: " + value);
    } else {
      value = numValue;
    }
  }
  return value;
};

callActionFromReq = function(actionName, action, binding, req, res) {
  var handler, p, paramName, paramValue, params, ref, ref1;
  params = [];
  ref = action.params;
  for (paramName in ref) {
    p = ref[paramName];
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
  handler = (ref1 = action.rest) != null ? ref1.handler : void 0;
  if (handler == null) {
    assert(typeof binding[actionName] === "function");
    return Promise["try"]((function(_this) {
      return function() {
        return binding[actionName].apply(binding, params);
      };
    })(this));
  } else {
    assert(typeof binding[handler] === "function");
    return Promise["try"]((function(_this) {
      return function() {
        return binding[handler](params, req);
      };
    })(this));
  }
};

callActionFromSocket = function(binding, action, call) {
  var actionName, handler, p, paramName, paramValue, params, ref, ref1;
  actionName = call.action;
  params = [];
  ref = action.params;
  for (paramName in ref) {
    p = ref[paramName];
    paramValue = null;
    if (call.params[paramName] != null) {
      paramValue = call.params[paramName];
    } else if (!p.optional) {
      throw new Error("expected param: " + paramName);
    }
    if (paramValue != null) {
      params.push(handleParamType(paramName, p, paramValue));
    }
  }
  handler = (ref1 = action.socket) != null ? ref1.handler : void 0;
  if (handler == null) {
    assert(typeof binding[actionName] === "function");
    return Promise["try"]((function(_this) {
      return function() {
        return binding[actionName].apply(binding, params);
      };
    })(this));
  } else {
    assert(typeof binding[handler] === "function");
    return Promise["try"]((function(_this) {
      return function() {
        return binding[handler](params, call);
      };
    })(this));
  }
};

toJson = function(result) {
  var e, i;
  if (Array.isArray(result)) {
    return (function() {
      var j, len, results;
      results = [];
      for (i = j = 0, len = result.length; j < len; i = ++j) {
        e = result[i];
        results.push(toJson(e));
      }
      return results;
    })();
  } else if (typeof result === "object") {
    if ((result != null ? result.toJson : void 0) != null) {
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
      var results;
      results = [];
      for (key in action.result) {
        results.push(key);
      }
      return results;
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
  return Promise["try"]((function(_this) {
    return function() {
      return callActionFromReq(actionName, action, binding, req);
    };
  })(this)).then(function(result) {
    var e, error1, response;
    response = null;
    try {
      if ((action.result != null) && (result == null)) {
        return sendErrorResponse(res, "Not Found", 404);
      }
      response = wrapActionResult(action, result);
    } catch (error1) {
      e = error1;
      throw new Error("Error on handling the result of " + actionName + ": " + e.message);
    }
    return sendSuccessResponse(res, response);
  })["catch"](function(error) {
    if (onError != null) {
      onError(error);
    }
    return sendErrorResponse(res, error);
  }).done();
};

callActionFromSocketAndRespond = function(socket, binding, action, call, checkPermissions) {
  var hasPermissions, result;
  if (checkPermissions != null) {
    hasPermissions = checkPermissions(socket, action);
  } else {
    hasPermissions = true;
  }
  if (hasPermissions) {
    result = callActionFromSocket(binding, action, call);
    return Promise.resolve(result).then((function(_this) {
      return function(result) {
        var e, error1, response;
        response = null;
        try {
          response = wrapActionResult(action, result);
        } catch (error1) {
          e = error1;
          throw new Error("Error on handling the result of " + call.action + ": " + e.message);
        }
        return socket.emit('callResult', {
          id: call.id,
          success: true,
          result: response
        });
      };
    })(this))["catch"]((function(_this) {
      return function(error) {
        if (typeof onError !== "undefined" && onError !== null) {
          onError(error);
        }
        return socket.emit('callResult', {
          id: call.id,
          success: false,
          error: error.message
        });
      };
    })(this));
  } else {
    return socket.emit('callResult', {
      id: call.id,
      error: "permission denied",
      success: false
    });
  }
};

createExpressRestApi = function(app, actions, binding, onError) {
  var action, actionName, fn;
  if (onError == null) {
    onError = null;
  }
  fn = (function(_this) {
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
    fn(actionName, action);
  }
};

_socketBindings = null;

createSocketIoApi = (function(_this) {
  return function(socket, actionsAndBindings, onError, checkPermissions) {
    if (onError == null) {
      onError = null;
    }
    if (checkPermissions == null) {
      checkPermissions = null;
    }
    return socket.on('call', function(call) {
      var actions, binding, fn, foundBinding, j, len, ref;
      assert((call.action != null) && typeof call.action === "string");
      assert((call.params != null) && typeof call.params === "object");
      assert(call.id != null ? typeof call.id === "string" || typeof call.id === "number" : true);
      foundBinding = false;
      fn = (function(_this) {
        return function(actions, binding) {
          var action;
          action = actions[call.action];
          if (action != null) {
            foundBinding = true;
            return callActionFromSocketAndRespond(socket, binding, action, call, checkPermissions);
          }
        };
      })(this);
      for (j = 0, len = actionsAndBindings.length; j < len; j++) {
        ref = actionsAndBindings[j], actions = ref[0], binding = ref[1];
        fn(actions, binding);
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
  return res.sendFile(path.resolve(__dirname, 'clients/decl-api-client.js'));
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
  callActionFromSocketAndRespond: callActionFromSocketAndRespond,
  callActionFromSocket: callActionFromSocket,
  sendErrorResponse: sendErrorResponse,
  sendSuccessResponse: sendSuccessResponse,
  serveClient: serveClient,
  stringifyApi: stringifyApi,
  docs: docs,
  checkConfig: checkConfig,
  getConfigDefaults: getConfigDefaults,
  enhanceJsonSchemaWithDefaults: enhanceJsonSchemaWithDefaults,
  createSocketIoApi: createSocketIoApi
};
