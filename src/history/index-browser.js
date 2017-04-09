/**
 * Singleton History object
 */
var util = require('util')
var EventEmitter = require('events')
var RadixRouter = require('radix-router')

var history = window ? window.history : {}

function History () {
  var self = this
  var router = self.router = new RadixRouter()

  window.addEventListener('popstate', function (event) {
    let newState = event.state
    let routeData
    let component

    if (newState) {
      routeData = router.lookup(newState.path)
      component = routeData.component
    }

    self.emit('change-route', {
      historyState: newState,
      component: component
    })
  })
}

util.inherits(History, EventEmitter)

History.prototype.push = function (path, componentState) {
  var self = this
  console.log(self.router)
  var routeData = self.router.lookup(path)
  if (!routeData) {
    throw new Error('Unable to find route ' + path)
  }
  var title = routeData.title
  var component = routeData.component
  console.log('component', component)
  var params = routeData.params

  componentState.params = params

  var state = {
    title: title,
    path: path,
    componentState: componentState
  }

  history.pushState(state, title, path)
  let newState = Object.assign(state, {history: this})

  self.emit('change-route', {
    historyState: newState,
    component: component
  })
}

History.prototype.findRoute = function (path) {
  return this.router.lookup(path)
}

History.prototype.pop = function () {
  let result = history.back()
  console.log(result)
}

History.prototype.replace = function () {
  history.forward()
}

History.prototype.registerRoute = function (path, routeData) {
  console.log('attempting to register route at path', path, routeData)
  var component = routeData.component

  if (path && component) {
    console.log('registering route', path, component)
    this.router.insert({
      path: path,
      component: component
    })
  }
}

History.prototype.removeRoute = function (path) {
  return this.router.remove(path)
}

History.prototype.getCurrentState = function () {
  return history.state
}

module.exports = new History()
