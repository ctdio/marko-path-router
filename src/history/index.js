const util = require('util')
const EventEmitter = require('events')
const RadixRouter = require('radix-router')

function History () {
  let self = this
  let router = self._router = new RadixRouter()
  self.currentPath = null
}

util.inherits(History, EventEmitter)

History.prototype.getRouter = function () {
  return this._router
}

History.prototype.push = function (path) {
  this.emit('change-route', null)
}

History.prototype.pop = function () {}

module.exports = new History()
