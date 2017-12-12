'use strict'
const history = require('../../history')
const nestedRoutePlaceholder = require('../nested-route-placeholder')
const assert = require('assert')

const RadixRouter = require('radix-router')

/**
 * A recursive helper function that registers the routes
 * and components with the internal path router
 *
 * @param {Object} router - the internal path router that is
 * used store and lookup routes
 * @param {Array<Object>} routes - the routes that will be added to the router
 * @param {String} parentPath - the path of the parent component
 *
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
      parentPath: parentPath.length ? parentPath : null,
      beforeEnter: route.beforeEnter
    })

    if (route.nestedRoutes) {
      _registerRoutes(router, route.nestedRoutes, currentPath)
    }
  }
}

/**
 * Helper funciton for determining if a transition should be halted
 *
 * @param {String} currentRoute - the rendered route
 * @param {String} nextRoute - the next route
 * @param {Function} beforeEnter - the hook to run before continuing
 */
function _shouldHaltTransition (currentRoute, nextRoute, beforeEnter) {
  return new Promise((resolve, reject) => {
    let haltTransition = false
    beforeEnter(currentRoute, nextRoute, (input) => {
      if (input instanceof Error) {
        // halt by rejecting
        return reject(input)
      }

      if (input === false) {
        haltTransition = true
      }

      resolve(haltTransition)
    })
  })
}

/**
 * A helper function for performing shallow copies.
 * This is only here to maintain backwards compatibility
 * with older browsers that don't support Object.assign
 * or object-rest-spread
 *
 * TODO: consider just transpiling this away
 *
 * @param {Object} object - the object to shallow copy
 *
 * @returns {Object} the shallow copied object
 */
function _shallowCopyObject (object) {
  let newObject = {}

  for (const key in object) {
    newObject[key] = object[key]
  }

  return newObject
}

/**
 * Helper function for performing route changes. This function
 * uses an algorithm that ensures unnecessary rerenders from happening.
 * It does so by traversing stack of rendered route components
 * and only rendering child components (the nested components from the
 * route definitions) if parent components already exist.
 *
 * Before routes are rendered and the internal component tracking
 * is modified, global hooks are run.
 *
 * @param {Object} self - the current marko-path-router instance
 * @param {String} routePath - the path to traverse to
 */
function _changeRoute (self, routePath) {
  const router = self._router

  let promise = Promise.resolve()
  const currentRoute = self.currentRoute

  if (self._beforeEach) {
    promise = promise
      .then(() => {
        return _shouldHaltTransition(currentRoute, routePath, self._beforeEach)
      })
  }

  let routeData

  return promise
    .then((haltTransition) => {
      if (haltTransition) {
        self.emit('transition-halted')
        return
      }

      routeData = router.lookup(routePath)

      if (!routeData) {
        self.emit('not-found')
        return
      }

      let parentPath = routeData.parentPath
      const params = routeData.params

      // path of the component that is going to be rendered
      let componentPath = routePath
      let component = routeData.component

      // copy the injected input object so that the
      // original structure cannot be tampered with by
      // child components
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

          // set the renderbody of the parent component to be the nestedRoutePlaceHolder,
          // upon the mounting of these components, the real component will be rendered
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
          // if there is an existing component in the component stack
          // that is the parent of the next set of routes, simply update it
          // to trigger the renders
          existingComponent.input = componentInput
          existingComponent.update()
        } else {
          // otherwise, render the component manually
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

        // as components are rendered, they will fill the component stack
        // child components are always rendered first then pushed into the buffer,
        // therefore we reverse the buffer before concatenating to the stack
        self._componentStack = self._componentStack.concat(self._componentBuffer.reverse())

        // clear the old component buffer
        self._componentBuffer = []
        self.currentRoute = routePath
        self.emit('update')
      }
    })
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

    this.currentRoute = null
    this._injectedComponentInput = input.injectedInput || {}

    // maintain a stack of components that are currently rendered
    this._componentStack = []
    this._componentBuffer = []

    this._beforeEach = null
    this._afterEach = null

    // traverse the given routes and create the router
    _registerRoutes(router, input.routes, undefined)
  },

  onMount: function () {
    const self = this
    const initialRoute = self.input && self.input.initialRoute

    const onChangeRoute = (routePath) => {
      _changeRoute(self, routePath)
        .then(() => {
          if (self._afterEach) {
            self._afterEach(self.currentRoute, routePath)
          }
        })
        .catch((err) => {
          self.emit('error', err)
        })
    }

    history.on('change-route', onChangeRoute)

    self.on('destroy', () => {
      history.removeListener('change-route', onChangeRoute)
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

  /**
   * Internal method used for registering a rendered component with the router.
   * Components that are registered are pushed into the component buffer.
   * At the end of the routing algorithm, the buffer will be cleared.
   *
   * @param {String} path - the path of the component that was rendered
   * @param {Object} component - the instance of the component that was rendered
   */
  register: function (path, component) {
    let currentComponent = this._componentStack[this._componentStack.length - 1]
    if (!currentComponent || currentComponent.path !== path) {
      this._componentBuffer.push({
        path: path,
        component: component
      })
    }
  },

  /**
   * Method for registering hooks that runs before every route change
   *
   * @param {Function} beforeEachFunc - the before each hook
   */
  beforeEach: function (beforeEachFunc) {
    assert(typeof beforeEachFunc === 'function',
      'Input to "beforeEach" must be a function')
    this._beforeEach = beforeEachFunc
  },

  /**
   * Method for registering hooks that runs after every route change
   *
   * @param {Function} afterEachFunc - the after each hook
   */
  afterEach: function (afterEachFunc) {
    assert(typeof afterEachFunc === 'function',
      'Input to "afterEach" must be a function')
    this._afterEach = afterEachFunc
  }
}
