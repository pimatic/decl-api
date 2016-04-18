(function() {
  var DeclApiClient;

  DeclApiClient = (function() {
    DeclApiClient.prototype.rest = {};

    function DeclApiClient(apiDef) {
      var action, actionName, ref;
      this.apiDef = apiDef;
      ref = this.apiDef.actions;
      for (actionName in ref) {
        action = ref[actionName];
        if (action.rest != null) {
          this.createRestAction(this.rest, actionName, action, action.rest);
        }
      }
    }

    DeclApiClient.prototype.createRestAction = function(obj, actionName, action, rest) {
      return obj[actionName] = ((function(_this) {
        return function(args, ajaxOptions) {
          var data, json, param, paramName, ref, ref1, regex, type, url;
          type = rest.type;
          url = rest.url;
          data = {};
          ref = action.params;
          for (paramName in ref) {
            param = ref[paramName];
            if (args[paramName] != null) {
              regex = new RegExp("(^|/)(\:" + paramName + ")(/|$)");
              if (regex.test(url)) {
                url = url.replace(regex, '$1!!!$3').replace('!!!', args[paramName]);
              } else {
                data[paramName] = args[paramName];
              }
            } else {
              if (!param.optional) {
                throw new Error("Expected param " + paramName);
              }
            }
          }
          json = ((ref1 = type.toLowerCase()) === "post" || ref1 === "patch");
          if (ajaxOptions == null) {
            ajaxOptions = {};
          }
          ajaxOptions.type = type;
          ajaxOptions.url = url;
          ajaxOptions.data = json ? JSON.stringify(data) : data;
          if (json) {
            ajaxOptions.contentType = "application/json; charset=utf-8";
            ajaxOptions.dataType = "json";
          }
          return jQuery.ajax(ajaxOptions);
        };
      })(this));
    };

    return DeclApiClient;

  })();

  window.DeclApiClient = DeclApiClient;

}).call(this);
