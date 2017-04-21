/* eslint-env mocha */
const assert = require('assert')

const Router = require('../index')
const TestComponent = require('../../../../test/util/test-component')
const history = require('../../../history')

const SHOULD_NOT_GET_HERE = new Error('Should not get here.')

function checkIfComponentOutputMatches (component, regex) {
  const html = component.getEl().outerHTML
  return html.match(regex)
}

describe('router', function () {
  it('should throw an error if given routes that do not contain a component', () => {
    try {
      Router.renderSync({
        routes: [
          { path: '/route' }
        ]
      })
      throw SHOULD_NOT_GET_HERE
    } catch (err) {
      let matches = err.message.match(/path and component must be provided/)
      assert(matches)
    }
  })

  it('should throw an error if given routes that do not contain a path', () => {
    try {
      Router.renderSync({
        routes: [
          { component: TestComponent }
        ]
      })
      throw SHOULD_NOT_GET_HERE
    } catch (err) {
      let matches = err.message.match(/path and component must be provided/)
      assert(matches)
    }
  })

  it('should throw an error if routes list is empty', () => {
    try {
      Router.renderSync({
        routes: []
      })
      throw SHOULD_NOT_GET_HERE
    } catch (err) {
      let matches = err.message.match(/"routes" list cannot be empty/)
      assert(matches, `Got: ${err.message}\n`)
    }
  })

  it('should throw an error if routes list not provided', () => {
    try {
      Router.renderSync({})
      throw SHOULD_NOT_GET_HERE
    } catch (err) {
      let matches = err.message.match(/"routes" param must be provided/)
      assert(matches, `Got: ${err.message}\n`)
    }
  })

  context('When pushing routes', () => {
    let component

    beforeEach('Create router for testing', () => {
      const render = Router.renderSync({
        routes: [
          {
            path: '/route',
            component: TestComponent,
            nestedRoutes: [
              { path: '/nested', component: TestComponent }
            ]
          }
        ]
      })
      // force history to "forget" what has happened
      history.currentPath = null

      component = render.appendTo(document.body)
        .getComponent()
    })

    afterEach(() => {
      component.destroy()
    })

    it('should be able to render route based on path pushed to history', () => {
      let matches = checkIfComponentOutputMatches(component, /test-component/g)
      assert(matches === null, 'Router should not have rendered any test components')

      history.push('/route')

      matches = checkIfComponentOutputMatches(component, /test-component/g)
      assert(matches.length === 1, 'A test component should have been rendered')
    })

    it('should be able to render nested routes', () => {
      let matches = checkIfComponentOutputMatches(component, /test-component/g)
      assert(matches === null, 'Router should not have rendered any test components')

      history.push('/route/nested')

      matches = checkIfComponentOutputMatches(component, /test-component/g)
      assert(matches.length === 2, 'Multiple test components should have been rendered')
    })

    it('should not rerender existing components', () => {
      history.push('/route/nested')

      let componentStack = component._componentStack

      assert(componentStack.length === 2, 'There should be two components being tracked by the router')

      let rootComponent = componentStack[0].component
      let nestedComponent = componentStack[1].component

      let rootComponentDestroyed = false
      let rootComponentUpdated = false
      let nestedComponentDestroyed = false

      rootComponent.on('destroy', () => {
        rootComponentDestroyed = true
      })

      rootComponent.on('update', () => {
        rootComponentUpdated = true
      })

      nestedComponent.on('destroy', () => {
        nestedComponentDestroyed = true
      })

      history.push('/route')

      assert(nestedComponentDestroyed, 'Nested component should have been destroyed')
      assert(!rootComponentDestroyed, 'Root component should not have been destroyed')
      assert(rootComponentUpdated, 'Root component should have been just updated')
    })

    it('should throw error if path that does not exist is pushed', () => {
      try {
        history.push('/route that does not exist')
        throw SHOULD_NOT_GET_HERE
      } catch (err) {
        let match = err.message.match(/Unable to find route \/route/)
        assert(match)
      }
    })
  })
})
