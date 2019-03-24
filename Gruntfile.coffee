# Grunt configuration updated to latest Grunt.  That means your minimum
# version necessary to run these tasks is Grunt 0.4.
#
# Please install this locally and install `grunt-cli` globally to run.
module.exports = (grunt) ->

  # Initialize the configuration.
  grunt.initConfig(
    coffee:
      default:
        options:
          bare: yes
        files: {
          'index.js': 'index.coffee'
          'docs.js': 'docs.coffee'
          'examples/example-api.js': 'examples/example-api.coffee'
          'test/test-api.js': 'test/test-api.coffee'
        }
      client:
        files: {
          'clients/decl-api-client.js': 'clients/decl-api-client.coffee'
        }

    mochaTest:
      test:
        options: {
          reporter: 'spec',
          quiet: false,
          clearRequireCache: false,
          noFail: false
        },
        src: ['test/**/*.js']

  )
  # Load external Grunt task plugins.
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-mocha-test'

  # Default task.
  grunt.registerTask "default", ["coffee", "mochaTest"]