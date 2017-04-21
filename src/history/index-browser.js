/**
 * Singleton History object
 */
const util = require('util')
const EventEmitter = require('events')
const RadixRouter = require('radix-router')

const browserHistory = window.history

function History () {
  let self = this
  let router = self._router = new RadixRouter()
  self.currentPath = null

  window.addEventListener('popstate', function (event) {
    const state = event.state
    if (state) {
      let path = state.path

      let routeData
      let parentPath
      let component

      routeData = router.lookup(path)
      component = routeData.component
      parentPath = routeData.parentPath

      self.emit('change-route', {
        path: path,
        parentPath: parentPath,
        component: component
      })
    }
  })
}

util.inherits(History, EventEmitter)

History.prototype.getRouter = function () {
  return this._router
}

History.prototype.push = function (path) {
  let self = this

  let router = self._router

  let oldPath = self.currentPath
  if (oldPath === path) {
    return
  }

  self.currentPath = path

  let routeData = router.lookup(path)
  if (!routeData) {
    throw new Error('Unable to find route ' + path)
  }

  let state = {
    path: path
  }

  // TODO: implement title
  browserHistory.pushState(state, '', path)
  self.emit('change-route', state)
}

History.prototype.pop = function () {
  browserHistory.back()
}

module.exports = new History()
