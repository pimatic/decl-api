(function() {
  var DeclApiClient;

  DeclApiClient = (function() {
    DeclApiClient.prototype.rest = {};

    function DeclApiClient(apiDef) {
      var action, actionName, _ref;
      this.apiDef = apiDef;
      _ref = this.apiDef.actions;
      for (actionName in _ref) {
        action = _ref[actionName];
        if (action.rest != null) {
          this.createRestAction(actionName, action);
        }
      }
    }

    DeclApiClient.prototype.createRestAction = function(actionName, action) {
      return this.rest[actionName] = ((function(_this) {
        return function(args, ajaxOptions) {
          var data, param, paramName, regex, type, url, _ref;
          type = action.rest.type;
          url = action.rest.url;
          data = {};
          _ref = action.params;
          for (paramName in _ref) {
            param = _ref[paramName];
            if (args[paramName] != null) {
              regex = new RegExp("(^|/)(\:" + paramName + ")(/|$)");
              if (regex.test(url)) {
                url = url.replace(regex, "$1" + args[paramName] + "$3");
              } else {
                data[paramName] = args[paramName];
              }
            } else {
              if (!param.optional) {
                throw new Error("Expected param " + paramName);
              }
            }
          }
          if (ajaxOptions == null) {
            ajaxOptions = {};
          }
          ajaxOptions.type = type;
          ajaxOptions.url = url;
          ajaxOptions.data = data;
          return jQuery.ajax(ajaxOptions);
        };
      })(this));
    };

    return DeclApiClient;

  })();

  window.DeclApiClient = DeclApiClient;

}).call(this);
