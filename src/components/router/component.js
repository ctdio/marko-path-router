'use strict'
const history = require('../../history')
const nestedRoutePlaceholder = require('../nested-route-placeholder')
const assert = require('assert')

const RadixRouter = require('radix-router')

/**
 * Inserts the routes all of the routes into the components
 */
function _registerRoutes (router, routes, parentPath) {
  parentPath = parentPath || ''

  for (let i = 0; i < routes.length; i++) {
    let route = routes[i]
    let currentPath = parentPath + route.path

    assert(route.path && route.component, 'path and component must be provided in a route')

    router.insert({
      path: currentPath,
      component: route.component,
      parentPath: parentPath.length ? parentPath : null
    })

    if (route.nestedRoutes) {
      _registerRoutes(router, route.nestedRoutes, currentPath)
    }
  }
}

// perform a shallow copy of an object
// (only because phantom doesn't have Object.assign)
function _shallowCopyObject (object) {
  let newObject = {}

  for (const key in object) {
    newObject[key] = object[key]
  }

  return newObject
}

function _handleRouteChange (self) {
  const router = self._router

  return function (routePath) {
    let routeData = router.lookup(routePath)

    if (!routeData) {
      self.emit('not-found')
      return
    }

    let parentPath = routeData.parentPath
    const params = routeData.params

    // path of the component that is going to be rendered
    let componentPath = routePath
    let component = routeData.component

    let componentInput = _shallowCopyObject(self._injectedComponentInput)
    if (params) {
      componentInput.params = params
    }

    let componentStack = self._componentStack

    if (component) {
      let existingComponent

      // if the component already exists in the component stack, find it and exit
      for (var i = 0; i < componentStack.length; i++) {
        if (routePath === componentStack[i].path) {
          existingComponent = componentStack[i].component
          componentStack = componentStack.slice(0, i + 1)
          break
        }
      }

      // while there is a parentPath, get the component and render the current
      // component within the parent. Continue until no more parents or
      // existing parent is found
      while (parentPath && !existingComponent) {
        let parentRouteData = router.lookup(parentPath)
        let parentComponent = parentRouteData.component

        // copy current component and input into new variable so that
        // it can be used by new renderBody function for parent
        let childComponent = component
        let childComponentInput = componentInput
        let childComponentPath = componentPath

        let parentComponentInput = _shallowCopyObject(componentInput)

        parentComponentInput.renderBody = function (out) {
          nestedRoutePlaceholder.render({
            path: childComponentPath,
            component: childComponent,
            componentInput: childComponentInput,
            router: self
          }, out)
        }

        // current component becomes the parent component
        component = parentComponent
        componentInput = parentComponentInput
        componentPath = parentPath

        let stackIndex = componentStack.length - 1

        // if no existing component found and component has a parent route,
        // traverse backwards, then slice off the remaining parts if
        // an existing component is found
        while (stackIndex >= 0) {
          let existingComponentData = componentStack[stackIndex]
          let existingPath = existingComponentData.path

          if (existingPath === routePath) {
            componentInput = {}
            existingComponent = existingComponentData.component
            break
          } else if (existingPath === parentPath) {
            existingComponent = existingComponentData.component
            break
          }

          stackIndex--
        }

        // component was found, break out
        if (existingComponent) {
          let stoppingPoint = stackIndex + 1
          while (componentStack.length > stoppingPoint) {
            componentStack.pop()
          }
          break
        }

        parentPath = parentRouteData.parentPath
      }

      if (existingComponent) {
        existingComponent.input = componentInput
        existingComponent.update()
      } else {
        var render = component.renderSync(componentInput)
        render.replaceChildrenOf(self.getEl('mount-point'))

        // TODO: handle renderers that are not components
        try {
          self._componentStack = [{
            path: componentPath,
            component: render.getComponent()
          }]
        } catch (err) {
          console.warn('No component to retrieve, not pushing to stack')
        }
      }

      self._componentStack = self._componentStack.concat(self._componentBuffer.reverse())

      self._componentBuffer = []
      self.currentRoute = routePath
      self.emit('update')
    }
  }
}

module.exports = {
  onCreate: function (input) {
    const routes = input.routes
    const mode = input.mode

    if (!routes) {
      throw new Error('"routes" param must be provided')
    } else if (routes && routes.length === 0) {
      throw new Error('"routes" list cannot be empty')
    }

    if (mode) {
      history.setMode(mode)
    }

    const router = this._router = new RadixRouter()

    this._injectedComponentInput = input.injectedInput || {}

    // maintain a stack of components that are currently rendered
    this._componentStack = []
    this._componentBuffer = []

    // traverse the given routes and create the router
    _registerRoutes(router, input.routes, undefined)
  },

  onMount: function () {
    const self = this
    const initialRoute = self.input && self.input.initialRoute

    let changeHandler = _handleRouteChange(self)
    history.on('change-route', changeHandler)

    self.on('destroy', () => {
      history.removeListener('change-route', changeHandler)
    })

    if (initialRoute) {
      try {
        history.push(initialRoute, {})
        self.currentRoute = initialRoute
      } catch (err) {
        throw new Error('Unable to push initial route ' + err)
      }
    }
  },

  register: function (path, component) {
    let currentComponent = this._componentStack[this._componentStack.length - 1]
    if (!currentComponent || currentComponent.path !== path) {
      this._componentBuffer.push({
        path: path,
        component: component
      })
    }
  }
}
