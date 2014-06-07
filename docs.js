var assert, declapi, genDocsForAction, genDocsForActions, genDocsForParam, genDocsForParams, printAction, printParam, printParamlist, _;

assert = require('assert');

declapi = require('./index.js');

_ = require('lodash');

genDocsForActions = function(actions) {
  var a, html, n;
  assert(typeof actions === "object");
  return html = "<div>\n  " + ((function() {
    var _results;
    _results = [];
    for (n in actions) {
      a = actions[n];
      _results.push(genDocsForAction(n, a));
    }
    return _results;
  })()) + "\n</div>";
};

printAction = function(actionName, action) {
  var html;
  return html = "" + actionName + "(" + (printParamlist(action)) + ")";
};

printParamlist = function(action) {
  var html, name, p, paramList;
  paramList = (function() {
    var _ref, _results;
    _ref = action.params || {};
    _results = [];
    for (name in _ref) {
      p = _ref[name];
      _results.push({
        name: name,
        p: p
      });
    }
    return _results;
  })();
  return html = "" + (_.reduce(paramList, (function(l, p) {
    return l + ", " + printParam(p.name, p);
  }), ""));
};

printParam = function(name, param) {
  return "" + name + " : " + param.type;
};

genDocsForAction = function(actionName, action) {
  var html;
  assert(typeof actionName === "string");
  assert(typeof action === "object");
  assert(action.description != null);
  return html = "<h3>" + actionName + "</h3>\n<div>\n  <pre>" + (printAction(actionName, action)) + "</pre>\n  <p>" + action.description + "</p>\n  " + (genDocsForParams(action.params)) + "\n</div>";
};

genDocsForParams = function(params) {
  var html, n, p;
  return html = "<ul>\n  " + ((function() {
    var _results;
    _results = [];
    for (n in params) {
      p = params[n];
      _results.push(genDocsForParam(n, p));
    }
    return _results;
  })()) + "\n</ul>";
};

genDocsForParam = function(paramName, param) {
  var html;
  return html = "<li><pre>" + paramName + "</pre>: " + param.description + "</li>";
};

module.exports = {
  genDocsForActions: genDocsForActions,
  genDocsForAction: genDocsForAction,
  genDocsForParams: genDocsForParams,
  genDocsForParam: genDocsForParam
};
