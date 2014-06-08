assert = require 'assert'
path = require 'path'
Q = require 'q'
_ = require 'lodash'

types = {
  number: "number"
  string: "string"
  array: "array"
  date: "date"
  object: "object"
  boolean: "boolean"
}
types.any = [types.number, types.boolean, types.string, types.array, types.date, types.object]


normalizeType = (type) ->
  assert type in _.values(types)
  return type

normalizeAction = (actionName, action) -> 
  assert typeof actionName is "string"
  assert typeof action is "object"
  assert action.description?
  unless action.params? then action.params = {}
  normalizeParams(action.params)
  return action

normalizeParams = (params) ->
  assert typeof params is "object"
  for paramName, param of params
    normalizeParam(paramName, param)
  return params

normalizeParam = (paramName, param) ->
  assert typeof paramName is "string"
  assert typeof param is "object"
  assert param.type?
  return param

normalizeActions = (actions) ->
  assert typeof actions is "object"
  for actionName, action of actions
    normalizeAction(actionName, action)
  return actions

sendSuccessResponse = (res, data = {}) ->
  data.success = true
  return res.send(200, data)

sendErrorResponse = (res, error) ->
  statusCode = 400
  message = null
  if error instanceof Error
    message = error.message
  else
    message = error
  return res.send(statusCode, {success: false, message: message})


handleParamType = (paramName, param, value) ->
  switch param.type
    when "boolean" then value = handleBooleanParam(paramName, param, value)
    when "object"
      unless typeof param is "object"
        throw new Error("Exprected #{paramName} to be a object, was: #{value}")
      if param.properties?
        for propName, prop of param.properties
          if value[propName]?
            value[propName] = handleParamType(propName, prop, value[propName])
          else
            unless prop.optional?
              throw new Error("Expected #{paramName} to have an property #{propName}.")

  return value

handleBooleanParam = (paramName, param, value) ->
  if typeof value is "string"
    unless value in ["true", "false"]
      throw new Error("Exprected #{paramName} to be boolean, was: #{value}")
    else
      value = (value is "true")
  return value

callActionFromReq = (actionName, action, binding, req) ->
  assert typeof binding[actionName] is "function"
  params = []
  for paramName, p of action.params
    paramValue = null
    if req.params[paramName]?
      paramValue = req.params[paramName]
    else if req.query[paramName]?
      pparamValue = req.query[paramName]
    else if req.body[paramName]?
      paramValue = req.body[paramName]
    else unless p.optional
      throw new Error("expected param: #{paramName}")
    if paramValue?
      # check type
      params.push handleParamType(paramName, p, paramValue)

  #console.log actionName, params
  return Q.fcall( => binding[actionName](params...) )

toJson = (result) ->
  if Array.isArray result
    return (toJson(e) for e, i in result)
  else if typeof result is "object"
    if result.toJson?
      return result.toJson()
  return result

wrapActionResult = (action, result) ->
  assert typeof action is "object"
  if action.result
    resultName = (key for key of action.result)[0]
    if action.result[resultName].toJson?
      result = toJson(result)
  else
    resultName = "result"

  response = {}; response[resultName] = result
  return response

callActionFromReqAndRespond = (actionName, action, binding, req, res, onError = null) ->
  assert typeof binding[actionName] is "function"
  return Q.fcall( => callActionFromReq(actionName, action, binding, req)
  ).then( (result) ->
    response = wrapActionResult(action, result)
    sendSuccessResponse res, response
  ).catch( (error) ->
    onError(error) if onError?
    sendErrorResponse res, error
  ).done()

createExpressRestApi = (app, actions, binding, onError = null) ->
  for actionName, action of actions
    do (actionName, action) =>
      if action.rest?
        type = (action.rest.type or 'get').toLowerCase()
        url = action.rest.url
        app[type](url, (req, res, next) =>
          callActionFromReqAndRespond(actionName, action, binding, req, res, onError)
        )
  return

serveClient = (req, res) ->
  res.sendfile(path.resolve(__dirname, 'clients/decl-api-client.js'))

stringifyApi = (api) -> JSON.stringify(api, null, " ")

docs = -> require('./docs.js')

module.exports = {
  types
  normalizeActions
  callActionFromReq
  wrapActionResult
  createExpressRestApi
  callActionFromReqAndRespond
  sendErrorResponse
  sendSuccessResponse
  serveClient
  stringifyApi
  docs
}