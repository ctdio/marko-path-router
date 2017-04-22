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

History.prototype.push = function (path) {
  let self = this
  let oldPath = self._currentPath

  // if old path matches current path, do nothing
  if (oldPath === path) {
    return
  }

  self._currentPath = path

  // TODO: implement title
  const state = { path: path }
  browserHistory.pushState(state, '', path)
  self.emit('change-route', path)
}

History.prototype.pop = function () {
  browserHistory.back()
}

module.exports = new History()
