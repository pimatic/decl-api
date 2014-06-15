decl-api
========

Declarative api definition for REST and real time APIs. 

##API-Definition

Apis are define as json object:

```coffee
declapi = require('../index.js')
t = declapi.types

api = {}
api.todo = {
  actions:
    listTasks:
      rest:
        type: "GET"
        url: "/api/tasks"
      description: "Lists all tasks"
      params: {}
      result:
        tasks:
          type: t.array 
    getTask:
      description: "Get a task by id"
      rest:
        type: "GET"
        url: "/api/tasks/:taskId"
      params:
        taskId:
          type: t.string
      result:
        task:
          type: t.object
    addTask:
      description: "Adds a task"
      rest:
        type: "POST"
        url: "/api/tasks"
      params:
        taskId:
          type: t.string
        task:
          type: t.object
          properties:
            description:
              type: t.string
            done:
              type: t.boolean
              optional: yes
      result:
        task:
          type: t.object
          properties:
            description:
              type: t.string
            done:
              type: t.boolean
}
```

##Implementation

Your Controller must implement the functions:

```coffee
TodoApp = {
  tasks: []
  listTasks: -> @tasks
  getTask: (taskId) -> 
    for t in @tasks
      if t.id is taskId
        return task
    return null
  addTask: (taskId, task) ->
    unless task.done then task.done = no
    task.id = taskId
    @tasks.push task
    return task
}
```

##Binding

###Express
    
```coffee
app = # Your express app
declapi = env.require 'decl-api'
todoApp = new TodoApp()
declapi.createExpressRestApi(app, api.todo, todoApp)
```

##REST-API

###listTasks
Returns the task list as json object

    GET /api/tasks 
    RESPONSE {success: true, tasks: [...]}

###addTask
Creates a taks with the id: someId and returns it as json-object

    POST /api/tasks/someId
    task[description]="some description"
    taks[done]=false
    RESPONSE
    {success: true, task: {id: "someId", description: "some description", done: false}}

###getTask
Returns the task with id == someId

    GET /api/tasks/someId
    RESPONSE
    {success: true, task: {id: "someId", description: "some description", done: false}}
