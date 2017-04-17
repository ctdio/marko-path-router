const history = require('../../history')

function _parentIsValid (parent) {
  let className = parent.className
  return parent && (className === 'marko-route' || className === 'marko-defined-routes')
}

module.exports = {
  onMount: function () {
    var el = this.getEl()
    var parent = el.parentNode
    var component = this.component

    var parentComponentPath
    var path = this.inputPath

    var valid = _parentIsValid(parent)
    do {
      // start linking to parent component here
      if (parent.className === 'marko-route') {
        var parentPath = parent.getAttribute('data-path')
        parentComponentPath = parentComponentPath ? parentPath + parentComponentPath : parentPath
        path = parentPath ? parentPath + path : path
      }

      // if on browser, register the component
      parent = parent.parentNode
    } while (_parentIsValid(parent))

    if (valid) {
      if (history.registerRoute) {
        history.registerRoute(path, {
          component,
          parentPath: parentComponentPath
        })
      }
    } else {
      throw new Error('<route> component parent must be either a <router> or another <route>')
    }
  },

  onInput: function (input) {
    this.inputPath = input.path
    this.component = input.component

    if (!this.inputPath || !this.component) {
      throw new Error('Invalid input for <route> component')
    }
  }
}
