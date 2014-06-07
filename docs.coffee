
assert = require 'assert'
declapi = require './index.js'
_ = require 'lodash'

genDocsForActions = (actions) ->
  assert typeof actions is "object"
  """
  <div>
    #{glueConcat((genDocsForAction(n, a) for n, a of actions))}
  </div>
  """

printAction = (actionName, action, result) ->
  """#{actionName}(#{printParamlist(action)})""" + (
    if result? then ' -> ' + printParam(result.name, result.info)
    else 
  )

glueList = (list) -> _.reduce(list, (l, r) -> "#{l}, #{r}")
glueConcat = (list) -> _.reduce(list, (l, r) -> "#{l}#{r}")
glueType = (list) -> _.reduce(list, (l, r) -> "#{l}|#{r}")

printParamlist = (action) ->
  if _.keys(action.params).length is 0 then return ''
  """
    #{glueList((printParam(name, p) for name, p of action.params))}
  """
printParam = (name, param) ->
  str = "#{name} : #{printType(param)}"
  if param.optional then str = "[#{str}]"
  return str

printType = (object) ->
  unless object? and object.type? then return ''
  if Array.isArray object.type
    """#{glueType(object.type)}"""
  else
    """#{object.type}"""


genRestDocs = (rest) ->
  """
  <pre class="api-action-rest">
    #{rest.type} #{rest.url}
  </pre>
  """

genDocsForAction = (actionName, action) ->
  assert typeof actionName is "string"
  assert typeof action is "object"
  assert action.description? 

  result = (
    if action.result? and _.keys(action.result).length > 0
      name = _.keys(action.result)[0]
      {name, info: action.result[name]}
  )

  """
  <div class="api-action">
  <h3 class="api-action-name">#{actionName}</h3>
  <div class="api-action-body">
    <pre class="api-action-signature">#{printAction(actionName, action, result)}</pre>
    <p class="api-action-description">#{action.description}</p>
    #{unless _.keys(action.params).length is 0 then '<h4>Parameters</h3>' else ''}
    #{genDocsForParams(action.params)}
  """ + (
    if result?
     """
     <h4>Result</h3>
      <ul>
        #{genDocsForParam(result.name, result.info)}
      </ul>
    """
    else ''
  ) + (
    if action.rest?
      """
      <h4>HTTP-Request</h4>
      #{genRestDocs(action.rest)}
      """
    else ''
  )+ """
  </div>
  </div>
  """

genDocsForParams = (params) ->
  if _.keys(params).length is 0 then return ''
  """
  <ul>
    #{glueConcat((genDocsForParam(n, p) for n, p of params))}
  </ul>
  """

genDocsForParam = (paramName, param) ->
  info = []
  info.push(printType param) if param.type?
  info.push('optional') if param.optional
  """
  <li class="api-param">
    <code class="api-param-name">#{paramName}</code>
    <span class="api-param-description">
      #{if info.length > 0 then '('+glueList(info)+')' else ''}
      #{genDocForParamDescription(param)}
    </span>
    #{if param.properties?
        '<ul class="action-param-properties">' + 
          glueConcat((genDocsForParam(n, p) for n, p of param.properties)) +
        '</ul>'
      else ''}
  </li>
  """

genDocForParamDescription = (param) ->
  unless param.description? then return ''
  """<span class="api-param-description">: #{param.description}"""

module.exports = {
  genDocsForActions
  genDocsForAction
  genDocsForParams
  genDocsForParam
}