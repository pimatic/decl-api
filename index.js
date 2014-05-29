var Q, assert, callActionFromReq, callActionFromReqAndRespond, createExpressRestApi, normalizeAction, normalizeActions, normalizeParam, normalizeParams, normalizeType, sendErrorResponse, sendSuccessResponse, toJson, types, wrapActionResult, _;

assert = require('assert');

Q = require('q');

_ = require('lodash');

types = {
  Any: [Number, String, Array, Date, Object]
};

normalizeType = function(type) {
  assert(type === Number || type === String || type === Array || type === Date || type === Object || type === "any");
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

callActionFromReq = function(actionName, action, binding, req) {
  var actualParamsLength, expectedParamsLength, p, paramName, params, _ref;
  actualParamsLength = _.keys(req.query).length + _.keys(req.params).length;
  expectedParamsLength = _.keys(action.params).length;
  if (!(actualParamsLength <= expectedParamsLength)) {
    throw new Error('wrong param count');
  }
  params = [];
  _ref = action.params;
  for (paramName in _ref) {
    p = _ref[paramName];
    if (req.params[paramName] != null) {
      params.push(req.params[paramName]);
    } else if (req.query[paramName] != null) {
      params.push(req.query[paramName]);
    } else if (!p.optional) {
      throw new Error("expected param: " + paramName);
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
          return callActionFromReqAndRespond(actionName, action, binding, req, res);
        });
      }
    };
  })(this);
  for (actionName in actions) {
    action = actions[actionName];
    _fn(actionName, action);
  }
};

module.exports = {
  types: types,
  normalizeActions: normalizeActions,
  callActionFromReq: callActionFromReq,
  wrapActionResult: wrapActionResult,
  createExpressRestApi: createExpressRestApi,
  callActionFromReqAndRespond: callActionFromReqAndRespond,
  sendErrorResponse: sendErrorResponse,
  sendSuccessResponse: sendSuccessResponse
};
