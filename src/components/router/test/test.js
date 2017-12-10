/* eslint-env mocha */
const assert = require('assert')
const waitForEvent = require('wait-for-event-promise')

const Router = require('../index')
const TestComponent = require('../../../../test/util/test-component')
const PlaceholderComponent = require('../../../../test/util/test-placeholder-component')
const WildcardComponent = require('../../../../test/util/test-wildcard-component')
const history = require('../../../history')

const SHOULD_NOT_GET_HERE = new Error('Should not get here.')
const TEST_COMPONENT = 'test-component'
const PLACEHOLDER_COMPONENT = 'placeholder-component'
const WILDCARD_COMPONENT = 'wildcard-component'

function assertRouterIsEmpty (router) {
  const mountPoint = router.getEl().children[0]
  assert(mountPoint.getAttribute('class') === 'marko-router-mount-point')

  assert(mountPoint.children.length === 0,
    'Router mount point should be empty')
}

describe('router', function () {
  it('should throw an error if given routes that do not contain a router', () => {
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
          { router: TestComponent }
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

  it('should throw an error if an incorrect mode is passed in', () => {
    const badMode = 'not an actual mode'
    try {
      Router.renderSync({
        mode: badMode,
        routes: [
          {
            path: '/',
            router: TestComponent
          }
        ]
      })
      throw SHOULD_NOT_GET_HERE
    } catch (err) {
      let matches = err.message.match(/Unknown mode:/)
      assert(matches, `Got: ${err.message}\n`)
    }
  })

  context('When pushing routes', () => {
    let router
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

      router = render.appendTo(document.body)
        .getComponent()
    })

    beforeEach(() => {
      assertRouterIsEmpty(router)
    })

    afterEach(() => {
      router.destroy()
    })

    it('should be able to render route based on path pushed to history', async () => {
      let historyLen = window.history.length
      history.push('/route')
      await waitForEvent(router, 'update')

      const mountPointEl = router.getEl().children[0]
      const testComponentEl = mountPointEl.children[0]

      assert(testComponentEl.getAttribute('class') === TEST_COMPONENT,
        'Mount point should contain a test router')

      // should be nothing rendered within the test router
      assert(testComponentEl.children.length === 0,
        'Test router should be empty')

      assert(window.history.length === historyLen + 1, 'History should have been pushed')
    })

    it('should be able to render route based on path replaced by history', async () => {
      history.push('/route/nested')
      await waitForEvent(router, 'update')

      let historyLen = window.history.length
      history.replace('/route')
      await waitForEvent(router, 'update')

      const mountPointEl = router.getEl().children[0]
      const testComponentEl = mountPointEl.children[0]

      assert(testComponentEl.getAttribute('class') === TEST_COMPONENT,
        'Mount point should contain a test router')

      // should be nothing rendered within the test router
      assert(testComponentEl.children.length === 0,
        'Test router should be empty')

      assert(window.history.length === historyLen, 'History should have been replaced')
      assert(window.history.state.path === '/route')
    })

    it('should be able to render nested routes', async () => {
      history.push('/route/nested')
      await waitForEvent(router, 'update')

      const mountPointEl = router.getEl().children[0]
      const testComponentEl = mountPointEl.children[0]
      assert(testComponentEl.getAttribute('class') === TEST_COMPONENT)

      assert(testComponentEl.children.length === 1,
        'Test router should not be empty')

      const nestedTestComponentEl = testComponentEl.children[0]

      assert(nestedTestComponentEl.getAttribute('class') === TEST_COMPONENT)

      assert(nestedTestComponentEl.children.length === 0,
        'There should be nothing nested in the router')
    })

    it('should be able to match placeholder routes', async () => {
      const placeholderFiller = 'some-filler-for-placeholder'

      history.push('/route/nested/' + placeholderFiller + '/info')
      await waitForEvent(router, 'update')

      const mountPointEl = router.getEl().children[0]
      const testComponentEl = mountPointEl.children[0]
      assert(testComponentEl.getAttribute('class') === TEST_COMPONENT)

      const nestedTestComponentEl = testComponentEl.children[0]
      assert(nestedTestComponentEl.getAttribute('class') === TEST_COMPONENT, nestedTestComponentEl.outerHTML)

      const placeholderEl = nestedTestComponentEl.children[0]
      assert(placeholderEl.getAttribute('class') === PLACEHOLDER_COMPONENT)
      assert(placeholderEl.children.length === 0,
        'Placeholder element should not contain child routers')
    })

    it('should be able to match wildcard routes', async () => {
      history.push('/route/other-nested/aoij3illjicsef')
      await waitForEvent(router, 'update')

      const mountPointEl = router.getEl().children[0]
      const testComponentEl = mountPointEl.children[0]

      const nestedTestComponent = testComponentEl.children[0]
      assert(nestedTestComponent.getAttribute('class') === TEST_COMPONENT)

      const wildcardComponent = nestedTestComponent.children[0]
      assert(wildcardComponent.getAttribute('class') === WILDCARD_COMPONENT)
    })

    it('should not rerender existing routers', async () => {
      history.push('/route/nested')
      await waitForEvent(router, 'update')

      let componentStack = router._componentStack

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
      await waitForEvent(router, 'update')

      assert(nestedComponentDestroyed, 'Nested component should have been destroyed')
      assert(!rootComponentDestroyed, 'Root component should not have been destroyed')
      assert(rootComponentUpdated, 'Root component should have been just updated')
    })

    it('should emit an event when a route that is not found given', async () => {
      history.push('/route that does not exist')
      await waitForEvent(router, 'not-found')
    })

    it('should pass along router input to all route components rendered', async () => {
      let componentStack = router._componentStack
      history.push('/route/nested')
      await waitForEvent(router, 'update')

      componentStack = router._componentStack

      for (let i = 0; i < componentStack.length; i++) {
        const { component } = componentStack[i]

        assert.equal(component.input.test, testInjectedInput.test,
          'route component input should contain the injected test attribute')
        assert.equal(component.input.foo, testInjectedInput.foo,
          'route component input should contain the injected foo attribute')
      }
    })
  })

  context('global hooks', () => {
    let router

    beforeEach('render router', () => {
      const render = Router.renderSync({
        routes: [
          {
            path: '/route',
            component: TestComponent
          },
          {
            path: '/other-route',
            component: TestComponent
          }
        ]
      })

      // force history to "forget" what has happened
      history._currentPath = null

      router = render.appendTo(document.body)
        .getComponent()
    })

    context('beforeEach hook', () => {
      it('should allow for hook to be registered', () => {
        const hook = () => {}
        router.beforeEach(hook)
        assert(router._beforeEach === hook,
          '_beforeEach function should match hook')
      })

      it('should pass the currentRoute, next route, and next func in as parameters', async () => {
        let currentRoute
        let nextRoute

        router.beforeEach((from, to, next) => {
          currentRoute = from
          nextRoute = to

          next()
        })

        history.push('/route')
        await waitForEvent(router, 'update')

        assert(currentRoute === null)
        assert(nextRoute === '/route')
      })

      it('should halt transition if an error is passed into "next"', async () => {
        const transitionError = new Error('Not transitioning')
        router.beforeEach((from, to, next) => next(transitionError))

        history.push('/route')
        const event = await waitForEvent(router, 'error')

        assert(event === transitionError,
          'transition-error event should equal the error passed into "next"')

        const mountPointEl = router.getEl().children[0]

        assert(mountPointEl.children.length === 0,
          'test component should not have rendered')
      })

      it('should halt transition if false is passed into "next"', () => {
        router.beforeEach((from, to, next) => next(false))

        history.push('/route')
        return waitForEvent(router, 'transition-halted')
      })
    })

    context('afterEach hook', () => {
      it('should allow for hooks to be registered', () => {
        const hook = () => {}
        router.afterEach(hook)
        assert(router._afterEach === hook,
          '_afterEach function should match hook')
      })

      // push first route in to allow for
      beforeEach(() => {
        history.push('/route')
        return waitForEvent(router, 'update')
      })

      it('should call the afterEach hook upon transition', async () => {
        let afterEachTriggered = false

        router.afterEach(() => {
          afterEachTriggered = true
        })

        history.push('/other-route')
        await waitForEvent(router, 'update')

        assert(afterEachTriggered === true,
          'should have triggered the afterEach hook')
      })
    })
  })
})
