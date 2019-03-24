assert = require('assert');
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

TodoApp = {
  tasks: []
  listTasks: -> @tasks
  getTask: (taskId) ->
    for t in @tasks
      if t.id is taskId
        return t
    return null
  addTask: (taskId, task) ->
    unless task.done then task.done = no
    task.id = taskId
    @tasks.push task
    return task
}

describe 'Sample API Test', () =>

  beforeEach () ->
    TodoApp.tasks = []
    TodoApp.addTask 1, { description: "dummy task", done: false}

  describe 'functions', () ->
    it 'should add a task', () ->
      assert.equal TodoApp.tasks.length, 1

    it 'should get a task', () ->
      assert TodoApp.getTask(1) isnt null
      assert TodoApp.getTask(0) is null


    it 'should list tasks', () ->
      assert TodoApp.listTasks().length is 1
