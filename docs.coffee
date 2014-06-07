
assert = require 'assert'
declapi = require './index.js'
_ = require 'lodash'

genDocsForActions = (actions) ->
  assert typeof actions is "object"
  html = """
    <div>
      #{genDocsForAction(n, a) for n, a of actions}
    </div>
  """

printAction = (actionName, action) ->
  html = """
    #{actionName}(#{printParamlist(action)})
  """

printParamlist = (action) ->
  paramList = ({name, p} for name, p of (action.params or {}))
  
  html = """
    #{_.reduce(paramList, ((l, p) -> l + ", " + printParam(p.name, p)) , "")}
  """
printParam = (name, param) ->
  "#{name} : #{param.type}"

genDocsForAction = (actionName, action) ->
  assert typeof actionName is "string"
  assert typeof action is "object"
  assert action.description? 

  html = """
    <h3>#{actionName}</h3>
    <div>
      <pre>#{printAction(actionName, action)}</pre>
      <p>#{action.description}</p>
      #{genDocsForParams(action.params)}
    </div>
  """

genDocsForParams = (params) ->
  html = """
    <ul>
      #{genDocsForParam(n, p) for n, p of params}
    </ul>
    """
genDocsForParam = (paramName, param) ->
  html = """
    <li><pre>#{paramName}</pre>: #{param.description}</li>
  """

module.exports = {
  genDocsForActions
  genDocsForAction
  genDocsForParams
  genDocsForParam
}