/**
 * Singleton History object
 */
const util = require('util')
const assert = require('assert')
const EventEmitter = require('events')

const browserHistory = window.history

const HISTORY_MODE = 'history'
const HASH_MODE = 'hash'

const modifyPath = require('../util/modifyPath')

function History () {
  let self = this
  self._currentPath = null
  self._mode = HISTORY_MODE

  window.addEventListener('popstate', function (event) {
    const state = event.state
    if (state) {
      self.emit('change-route', state.path)
    }
  })

  window.addEventListener('hashchange', function () {
    if (self._mode === HASH_MODE) {
      const hash = window.location.hash
      const path = hash.substring(1, hash.length) || '/'
      self.emit('change-route', path)
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

  const newPath = modifyPath(self, path)

  // TODO: implement title
  const state = { path: path }

  if (type === 'push') {
    browserHistory.pushState(state, '', newPath)
  } else {
    browserHistory.replaceState(state, '', newPath)
  }

  self.emit('change-route', path)
}

History.prototype.setMode = function (mode) {
  assert(mode === HASH_MODE || mode === HISTORY_MODE,
    `Unknown mode: "${mode}". Accepted values are ` +
    `"${HASH_MODE}" ` + `and "${HISTORY_MODE}"`)

  this._mode = mode
}

History.prototype.getMode = function () {
  return this._mode
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
