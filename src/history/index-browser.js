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
  self.currentPath = null

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
  let self = this

  let router = self.router

  let oldPath = self.currentPath
  if (oldPath === path) {
    return
  }

  self.currentPath = path

  let routeData = router.lookup(path)
  if (!routeData) {
    throw new Error('Unable to find route' + path)
  }


  let title = routeData.title
  let params = routeData.params
  let parentComponentPath = routeData.parentPath
  let currentComponent = routeData.component

  let currentPath = path
  let currentComponentInput = componentState

  // todo: move this over to the router component to handle
  // also, how to set state for parent component?
  while (parentComponentPath) {
    let parentRouteData = router.lookup(parentComponentPath)
    let parentComponent = parentRouteData.component

    // copy current component and input into new let so that
    // it can be used by new renderBody function for parent
    let childComponent = currentComponent
    let childComponentInput = currentComponentInput

    let parentComponentInput = {
      renderBody: function (out) {
        childComponent.render(childComponentInput, out)
      }
    }

    // current component becomes the parent component
    currentComponent = parentComponent
    currentComponentInput = parentComponentInput

    parentComponentPath = parentRouteData.parentPath
  }

  console.log('final input', currentComponentInput)

  let state = {
    title: title,
    path: path,
    componentInput: currentComponentInput
  }

  //history.pushState(state, title, path)
  let newState = Object.assign(state, { history: this })

  self.emit('change-route', {
    historyState: newState,
    component: currentComponent
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
  var parentPath = routeData.parentPath

  if (path && component) {
    console.log('registering route', path, component, parentPath)
    this.router.insert({
      path: path,
      component: component,
      parentPath: parentPath
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
