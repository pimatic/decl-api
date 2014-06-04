
class DeclApiClient
  rest: {}
  constructor: (@apiDef) ->
    for actionName, action of @apiDef.actions
      if action.rest?
        @createRestAction(actionName, action)


  createRestAction: (actionName, action) ->
    @rest[actionName] = ( (args, ajaxOptions) =>
      type = action.rest.type
      url = action.rest.url
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
      ajaxOptions.type = type
      ajaxOptions.url = url
      ajaxOptions.data = data
      return jQuery.ajax(ajaxOptions)
    )

window.DeclApiClient = DeclApiClient