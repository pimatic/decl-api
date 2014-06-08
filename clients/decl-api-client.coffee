
class DeclApiClient
  rest: {}
  constructor: (@apiDef) ->
    for actionName, action of @apiDef.actions
      if action.rest?
        @createRestAction(@rest, actionName, action, action.rest)


  createRestAction: (obj, actionName, action, rest) ->
    obj[actionName] = ( (args, ajaxOptions) =>
      data = {}
      for paramName, param of action.params
        if args[paramName]?
          # test if its an url paramter
          regex = new RegExp("(^|/)(\:#{paramName})(/|$)")
          if regex.test(url)
            url = url.replace(regex, "$1#{args[paramName]}$3");
          else
            data[paramName] = args[paramName]
        else 
          unless param.optional
            throw new Error("Expected param #{paramName}")

      unless ajaxOptions? then ajaxOptions = {}
      ajaxOptions.type = rest.type
      ajaxOptions.url = rest.url
      ajaxOptions.data = data
      return jQuery.ajax(ajaxOptions)
    )

window.DeclApiClient = DeclApiClient