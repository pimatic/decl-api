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
}
types.any = [types.number, types.string, types.array, types.date, types.object]


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

callActionFromReq = (actionName, action, binding, req) ->
  assert typeof binding[actionName] is "function"
  params = []
  for paramName, p of action.params
    if req.params[paramName]?
      params.push req.params[paramName]
    else if req.query[paramName]?
      params.push req.query[paramName]
    else if req.body[paramName]?
      params.push req.body[paramName]
    else unless p.optional
      throw new Error("expected param: #{paramName}")
  #console.log actionName, params, req.query
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
}