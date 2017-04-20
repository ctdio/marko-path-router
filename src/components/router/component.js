'use strict'
var history = require('../../history')
var nestedRoutePlaceholder = require('../nested-route-placeholder')

module.exports = {
  onCreate: function () {
    // maintain a stack of components that are currently rendered
    this.componentStack = []
    this.componentBuffer = []
  },

  onMount: function () {
    var self = this
    var initialRoute = this.initialRoute

    history.on('change-route', function (event) {
      let routePath = event.path
      console.log('routePath', routePath)
      let routeData = history.findRoute(routePath)
      let parentPath = routeData.parentPath

      // path of the component that is going to be rendered
      let componentPath = routePath
      let component = routeData.component
      let componentInput = {}

      let componentStack = self.componentStack

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
          let parentRouteData = history.findRoute(parentPath)
          let parentComponent = parentRouteData.component

          // copy current component and input into new variable so that
          // it can be used by new renderBody function for parent
          let childComponent = component
          let childComponentInput = componentInput
          let childComponentPath = componentPath

          let parentComponentInput = {
            renderBody: function (out) {
              nestedRoutePlaceholder.render({
                path: childComponentPath,
                component: childComponent,
                componentInput: childComponentInput,
                router: self
              }, out)
            }
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
            let path = existingComponentData.path

            if (path === routePath) {
              componentInput = {}
              existingComponent = existingComponentData.component
              break
            } else if (path === parentPath) {
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
          self.componentStack = componentStack.concat(self.componentBuffer.reverse())
        } else {
          var render = component.renderSync(componentInput)
          render.replaceChildrenOf(self.getEl('mount-point'))
          // Todo: handle renderers that are not strictly components
          try {
            self.componentStack = [{
              path: componentPath,
              component: render.getComponent()
            }]
          } catch (err) {
            console.warn('No component to retrieve, not pushing to stack')
          }
        }

        self.componentBuffer = []
        self.currentRoute = routePath
        self.emit('update')
      }
    })

    if (initialRoute) {
      try {
        history.push(initialRoute, {})
        this.currentRoute = initialRoute
      } catch (err) {
        throw new Error('Unable to push initial route ' + err)
      }
    }
  },

  onInput: function (input) {
    this.initialRoute = input.initialRoute
  },

  onDestroy: function () {
    // clear history?
  },

  // registers rendered components and their path with the router
  register: function (path, component) {
    let currentComponent = this.componentStack[this.componentStack.length - 1]
    if (!currentComponent || currentComponent.path !== path) {
      this.componentBuffer.push({
        path: path,
        component: component
      })
    }
  }
}
