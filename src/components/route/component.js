const history = require('../../history')

function _parentIsValid (parent) {
  let className = parent.className
  return parent && (className === 'marko-route' || className === 'marko-defined-routes')
}

module.exports = {
  // TODO: figure out how to cleanly pass down full parent path
  // so that the registering can be done in the onCreate hook
  onMount: function () {
    let input = this.input

    let el = this.getEl()
    let parent = el.parentNode

    let path = input.path
    let component = input.component

    let parentComponentPath

    let valid = _parentIsValid(parent)
    while (parent && _parentIsValid(parent)) {
      // start linking to parent component here
      if (parent.className === 'marko-route') {
        let parentPath = parent.getAttribute('data-path')
        parentComponentPath = parentComponentPath ? parentPath + parentComponentPath : parentPath
        path = parentPath ? parentPath + path : path
      }

      parent = parent.parentNode
    }

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
    if (!input.path || !input.component) {
      throw new Error('Invalid input for <route> component')
    }
  }
}
