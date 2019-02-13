var TodoApp, api, declapi, printHtmlDocs, t;

declapi = require('../index.js');

t = declapi.types;

api = {};

api.todo = {
  actions: {
    listTasks: {
      rest: {
        type: "GET",
        url: "/api/tasks"
      },
      description: "Lists all tasks",
      params: {},
      result: {
        tasks: {
          type: t.array
        }
      }
    },
    getTask: {
      description: "Get a task by id",
      rest: {
        type: "GET",
        url: "/api/tasks/:taskId"
      },
      params: {
        taskId: {
          type: t.string
        }
      },
      result: {
        task: {
          type: t.object
        }
      }
    },
    addTask: {
      description: "Adds a task",
      rest: {
        type: "POST",
        url: "/api/tasks"
      },
      params: {
        taskId: {
          type: t.string
        },
        task: {
          type: t.object,
          properties: {
            description: {
              type: t.string
            },
            done: {
              type: t.boolean,
              optional: true
            }
          }
        }
      },
      result: {
        task: {
          type: t.object,
          properties: {
            description: {
              type: t.string
            },
            done: {
              type: t.boolean
            }
          }
        }
      }
    }
  }
};

TodoApp = {
  tasks: [],
  listTasks: function() {
    return this.tasks;
  },
  getTask: function(taskId) {
    var i, len, ref;
    ref = this.tasks;
    for (i = 0, len = ref.length; i < len; i++) {
      t = ref[i];
      if (t.id === taskId) {
        return t;
      }
    }
    return null;
  },
  addTask: function(taskId, task) {
    if (!task.done) {
      task.done = false;
    }
    task.id = taskId;
    this.tasks.push(task);
    return task;
  }
};

printHtmlDocs = function() {
  return console.log(declapi.docs().genDocsForActions(api.todo.actions));
};

printHtmlDocs("test.html");
