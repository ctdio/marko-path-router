'use strict'
require('./styles.css')
var history = require('../../history')

module.exports = {
  onMount: function () {
    var self = this
    var initialRoute = this.initialRoute

    history.on('change-route', function (event) {
      var component = event.component
      if (component) {
        console.log('component before render', component)
        console.log(component.createOut(null, null, null ))
        var componentState = event.historyState.componentState
        var renderedComponent = component.renderSync(componentState)
        self.setComponent(renderedComponent)
      }
    })

    if (initialRoute) {
      try {
        history.push(initialRoute, {})
      } catch (err) {
        throw new Error('Unable to push initial route', initialRoute)
      }
    }
  },

  onInput: function (input) {
    console.log(input)
    this.initialRoute = input.initialRoute
  },

  setComponent: function (component) {
    console.log('rendered component', component)
    component.replaceChildrenOf(this.getEl('mount-point'))
  }
}
