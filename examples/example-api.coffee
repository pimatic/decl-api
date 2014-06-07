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


printHtmlDocs = () ->
  console.log(
    declapi.docs().genDocsForActions(api.todo.actions)
  )

printHtmlDocs()