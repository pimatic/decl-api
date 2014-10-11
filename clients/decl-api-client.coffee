
class DeclApiClient
  rest: {}
  constructor: (@apiDef) ->
    for actionName, action of @apiDef.actions
      if action.rest?
        @createRestAction(@rest, actionName, action, action.rest)


  createRestAction: (obj, actionName, action, rest) ->
    obj[actionName] = ( (args, ajaxOptions) =>
      type = rest.type
      url = rest.url
      data = {}
      for paramName, param of action.params
        if args[paramName]?
          # test if its an url paramter
          regex = new RegExp("(^|/)(\:#{paramName})(/|$)")
          if regex.test(url)
            # ":paramName" can't be replaced directly, because parametername could
            # include regexp special chars, so replace by "!!!" and then by value
            url = url.replace(regex, '$1!!!$3').replace('!!!', args[paramName])
          else
            data[paramName] = args[paramName]
        else 
          unless param.optional
            throw new Error("Expected param #{paramName}")

      json = (type.toLowerCase() in ["post", "patch"])
      unless ajaxOptions? then ajaxOptions = {}
      ajaxOptions.type = type
      ajaxOptions.url = url
      ajaxOptions.data = if json then JSON.stringify(data) else data
      if json
        ajaxOptions.contentType = "application/json; charset=utf-8"
        ajaxOptions.dataType = "json"
      return jQuery.ajax(ajaxOptions)
    )

window.DeclApiClient = DeclApiClient