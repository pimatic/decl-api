var assert, declapi, genDocForParamDescription, genDocsForAction, genDocsForActions, genDocsForParam, genDocsForParams, genRestDocs, glueConcat, glueList, glueType, printAction, printParam, printParamlist, printType, _;

assert = require('assert');

declapi = require('./index.js');

_ = require('lodash');

genDocsForActions = function(actions) {
  var a, n;
  assert(typeof actions === "object");
  return "<div>\n  " + (glueConcat((function() {
    var _results;
    _results = [];
    for (n in actions) {
      a = actions[n];
      _results.push(genDocsForAction(n, a));
    }
    return _results;
  })())) + "\n</div>";
};

printAction = function(actionName, action, result) {
  return ("" + actionName + "(" + (printParamlist(action)) + ")") + (result != null ? ' -> ' + printParam(result.name, result.info) : void 0);
};

glueList = function(list) {
  return _.reduce(list, function(l, r) {
    return "" + l + ", " + r;
  });
};

glueConcat = function(list) {
  return _.reduce(list, function(l, r) {
    return "" + l + r;
  });
};

glueType = function(list) {
  return _.reduce(list, function(l, r) {
    return "" + l + "|" + r;
  });
};

printParamlist = function(action) {
  var name, p;
  if (_.keys(action.params).length === 0) {
    return '';
  }
  return "" + (glueList((function() {
    var _ref, _results;
    _ref = action.params;
    _results = [];
    for (name in _ref) {
      p = _ref[name];
      _results.push(printParam(name, p));
    }
    return _results;
  })()));
};

printParam = function(name, param) {
  var str;
  str = "" + name + " : " + (printType(param));
  if (param.optional) {
    str = "[" + str + "]";
  }
  return str;
};

printType = function(object) {
  if (!((object != null) && (object.type != null))) {
    return '';
  }
  if (Array.isArray(object.type)) {
    return "" + (glueType(object.type));
  } else {
    return "" + object.type;
  }
};

genRestDocs = function(rest) {
  return "<pre class=\"api-action-rest\">\n  " + rest.type + " " + rest.url + "\n</pre>";
};

genDocsForAction = function(actionName, action) {
  var name, result;
  assert(typeof actionName === "string");
  assert(typeof action === "object");
  assert(action.description != null);
  result = ((action.result != null) && _.keys(action.result).length > 0 ? (name = _.keys(action.result)[0], {
    name: name,
    info: action.result[name]
  }) : void 0);
  return ("<div class=\"api-action\">\n<h3 class=\"api-action-name\">" + actionName + "</h3>\n<div class=\"api-action-body\">\n  <pre class=\"api-action-signature\">" + (printAction(actionName, action, result)) + "</pre>\n  <p class=\"api-action-description\">" + action.description + "</p>\n  " + (_.keys(action.params).length !== 0 ? '<h4>Parameters</h3>' : '') + "\n  " + (genDocsForParams(action.params))) + (result != null ? "<h4>Result</h3>\n <ul>\n   " + (genDocsForParam(result.name, result.info)) + "\n </ul>" : '') + (action.rest != null ? "<h4>HTTP-Request</h4>\n" + (genRestDocs(action.rest)) : '') + "</div>\n</div>";
};

genDocsForParams = function(params) {
  var n, p;
  if (_.keys(params).length === 0) {
    return '';
  }
  return "<ul>\n  " + (glueConcat((function() {
    var _results;
    _results = [];
    for (n in params) {
      p = params[n];
      _results.push(genDocsForParam(n, p));
    }
    return _results;
  })())) + "\n</ul>";
};

genDocsForParam = function(paramName, param) {
  var info, n, p;
  info = [];
  if (param.type != null) {
    info.push(printType(param));
  }
  if (param.optional) {
    info.push('optional');
  }
  return "<li class=\"api-param\">\n  <code class=\"api-param-name\">" + paramName + "</code>\n  <span class=\"api-param-description\">\n    " + (info.length > 0 ? '(' + glueList(info) + ')' : '') + "\n    " + (genDocForParamDescription(param)) + "\n  </span>\n  " + (param.properties != null ? '<ul class="action-param-properties">' + glueConcat((function() {
    var _ref, _results;
    _ref = param.properties;
    _results = [];
    for (n in _ref) {
      p = _ref[n];
      _results.push(genDocsForParam(n, p));
    }
    return _results;
  })()) + '</ul>' : '') + "\n  " + (param.items != null ? '<ul class="action-param-items">' + glueConcat((function() {
    var _ref, _results;
    _ref = param.items;
    _results = [];
    for (n in _ref) {
      p = _ref[n];
      _results.push(genDocsForParam(n, p));
    }
    return _results;
  })()) + '</ul>' : '') + "\n</li>";
};

genDocForParamDescription = function(param) {
  if (param.description == null) {
    return '';
  }
  return "<span class=\"api-param-description\">: " + param.description;
};

module.exports = {
  genDocsForActions: genDocsForActions,
  genDocsForAction: genDocsForAction,
  genDocsForParams: genDocsForParams,
  genDocsForParam: genDocsForParam
};
