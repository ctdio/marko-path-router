/**
 * Singleton History object
 */
const util = require('util')
const EventEmitter = require('events')

const browserHistory = window.history

function History () {
  let self = this
  self._currentPath = null

  window.addEventListener('popstate', function (event) {
    const state = event.state
    if (state) {
      self.emit('change-route', state.path)
    }
  })
}

util.inherits(History, EventEmitter)

function changeRoute (self, path, type) {
  let oldPath = self._currentPath

  // if old path matches current path, do nothing
  if (oldPath === path) {
    return
  }

  self._currentPath = path

  // TODO: implement title
  const state = { path: path }
  if (type === 'push') {
    browserHistory.pushState(state, '', path)
  } else {
    browserHistory.replaceState(state, '', path)
  }
  self.emit('change-route', path)
}

History.prototype.push = function (path) {
  changeRoute(this, path, 'push')
}

History.prototype.replace = function (path) {
  changeRoute(this, path, 'replace')
}

/**
 * Convenience functions for moving through history
 */

History.prototype.back = function () {
  browserHistory.back()
}

History.prototype.forward = function () {
  browserHistory.forward()
}

History.prototype.go = function (place) {
  browserHistory.go(place)
}

module.exports = new History()
