/* eslint-env mocha */
const assert = require('assert')

const Router = require('../index')
const TestComponent = require('../../../../test/util/test-component')
const PlaceholderComponent = require('../../../../test/util/test-placeholder-component')
const WildcardComponent = require('../../../../test/util/test-wildcard-component')
const history = require('../../../history')

const SHOULD_NOT_GET_HERE = new Error('Should not get here.')
const TEST_COMPONENT = 'test-component'
const PLACEHOLDER_COMPONENT = 'placeholder-component'
const WILDCARD_COMPONENT = 'wildcard-component'

function assertRouterIsEmpty (component) {
  const mountPoint = component.getEl().children[0]
  assert(mountPoint.getAttribute('class') === 'marko-router-mount-point')

  assert(mountPoint.children.length === 0,
    'Router mount point should be empty')
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
    const testInjectedInput = {
      test: 'test',
      foo: 'bar'
    }

    beforeEach('Create router for testing', () => {
      const render = Router.renderSync({
        injectedInput: testInjectedInput,
        routes: [
          {
            path: '/route',
            component: TestComponent,
            nestedRoutes: [
              {
                path: '/nested',
                component: TestComponent,
                nestedRoutes: [
                  {
                    path: '/:placeholder/info',
                    component: PlaceholderComponent
                  }
                ]
              },
              {
                path: '/other-nested',
                component: TestComponent,
                nestedRoutes: [
                  { path: '/deep-nested', component: TestComponent },
                  { path: '/**', component: WildcardComponent }
                ]
              }
            ]
          }
        ]
      })

      // force history to "forget" what has happened
      history._currentPath = null

      component = render.appendTo(document.body)
        .getComponent()
    })

    beforeEach(() => {
      assertRouterIsEmpty(component)
    })

    afterEach(() => {
      component.destroy()
    })

    it('should be able to render route based on path pushed to history', () => {
      let historyLen = window.history.length
      history.push('/route')

      const mountPointEl = component.getEl().children[0]
      const testComponentEl = mountPointEl.children[0]

      assert(testComponentEl.getAttribute('class') === TEST_COMPONENT,
        'Mount point should contain a test component')

      // should be nothing rendered within the test component
      assert(testComponentEl.children.length === 0,
        'Test component should be empty')

      assert(window.history.length === historyLen + 1, 'History should have been pushed')
    })

    it('should be able to render route based on path replaced by history', () => {
      history.push('/route/nested')

      let historyLen = window.history.length
      history.replace('/route')

      const mountPointEl = component.getEl().children[0]
      const testComponentEl = mountPointEl.children[0]

      assert(testComponentEl.getAttribute('class') === TEST_COMPONENT,
        'Mount point should contain a test component')

      // should be nothing rendered within the test component
      assert(testComponentEl.children.length === 0,
        'Test component should be empty')

      assert(window.history.length === historyLen, 'History should have been replaced')
      assert(window.history.state.path === '/route')
    })

    it('should be able to render nested routes', () => {
      history.push('/route/nested')

      const mountPointEl = component.getEl().children[0]
      const testComponentEl = mountPointEl.children[0]
      assert(testComponentEl.getAttribute('class') === TEST_COMPONENT)

      assert(testComponentEl.children.length === 1,
        'Test component should not be empty')

      const nestedTestComponentEl = testComponentEl.children[0]

      assert(nestedTestComponentEl.getAttribute('class') === TEST_COMPONENT)

      assert(nestedTestComponentEl.children.length === 0,
        'There should be nothing nested in the component')
    })

    it('should be able to match placeholder routes', () => {
      const placeholderFiller = 'some-filler-for-placeholder'

      history.push('/route/nested/' + placeholderFiller + '/info')

      const mountPointEl = component.getEl().children[0]
      const testComponentEl = mountPointEl.children[0]
      assert(testComponentEl.getAttribute('class') === TEST_COMPONENT)

      const nestedTestComponentEl = testComponentEl.children[0]
      assert(nestedTestComponentEl.getAttribute('class') === TEST_COMPONENT, nestedTestComponentEl.outerHTML)

      const placeholderEl = nestedTestComponentEl.children[0]
      assert(placeholderEl.getAttribute('class') === PLACEHOLDER_COMPONENT)
      assert(placeholderEl.children.length === 0,
        'Placeholder element should not contain child components')
    })

    it('should be able to match wildcard routes', () => {
      history.push('/route/other-nested/aoij3illjicsef')

      const mountPointEl = component.getEl().children[0]
      const testComponentEl = mountPointEl.children[0]

      const nestedTestComponent = testComponentEl.children[0]
      assert(nestedTestComponent.getAttribute('class') === TEST_COMPONENT)

      const wildcardComponent = nestedTestComponent.children[0]
      assert(wildcardComponent.getAttribute('class') === WILDCARD_COMPONENT)
    })

    it('should not rerender existing components', () => {
      history.push('/route/nested')

      let componentStack = component._componentStack

      assert(componentStack.length === 2,
        'There should be two components being tracked by the router. Actual = ' +
        componentStack.length)

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

    it('should emit an event when a route that is not found given', () => {
      let notFoundTriggered = false

      component.on('not-found', () => {
        notFoundTriggered = true
      })

      history.push('/route that does not exist')

      assert(notFoundTriggered, 'not-found event shoud have been triggered')
    })

    it('should pass along router input to all components route components rendered', () => {
      let componentStack = component._componentStack
      history.push('/route/nested')

      componentStack = component._componentStack

      for (let i = 0; i < componentStack.length; i++) {
        const { component } = componentStack[i]

        assert.equal(component.input.test, testInjectedInput.test,
          'route component input should contain the injected test attribute')
        assert.equal(component.input.foo, testInjectedInput.foo,
          'route component input should contain the injected foo attribute')
      }
    })
  })
})
