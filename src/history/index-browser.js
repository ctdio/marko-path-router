/**
 * Singleton History object
 */
const util = require('util')
const EventEmitter = require('events')
const RadixRouter = require('radix-router')

const history = window ? window.history : {}

function History () {
  let self = this
  let router = self.router = new RadixRouter()
  self.currentPath = null

  window.addEventListener('popstate', function (event) {
    const state = event.state
    const title = event.title

    let routeData
    let parentPath
    let component

    routeData = router.lookup(state.path)
    component = routeData.component
    parentPath = routeData.parentPath

    self.emit('change-route', {
      path: state.path,
      parentPath: parentPath,
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
    throw new Error('Unable to find route ' + path)
  }

  let title = routeData.title
  let params = routeData.params
  let parentComponentPath = routeData.parentPath
  let currentComponent = routeData.component

  let currentPath = path
  let currentComponentInput = componentState

  let state = {
    title: title,
    path: path
  }


  history.pushState(state, title, path)
  self.emit('change-route', state)
}

History.prototype.findRoute = function (path) {
  return this.router.lookup(path)
}

History.prototype.pop = function () {
  let result = history.back()
}

History.prototype.replace = function () {
  history.forward()
}

History.prototype.registerRoute = function (path, routeData) {
  var component = routeData.component
  var parentPath = routeData.parentPath

  if (path && component) {
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
