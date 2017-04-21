/* eslint-env mocha */
const assert = require('assert')

const Router = require('../../router')
const TestComponent = require('../../../../test/util/test-component')
const NestedRoutePlaceholder = require('../index')

describe('nested-route-placeholder component', () => {
  let routerComponent
  let testContainer

  before(() => {
    const render = Router.renderSync({
      routes: [ { path: '/', component: TestComponent } ]
    })

    routerComponent = render.appendTo(document.body)
      .getComponent()

    testContainer = document.createElement('DIV')
    document.body.appendChild(testContainer)
  })

  after(() => {
    routerComponent.destroy()
    testContainer.remove()
  })

  it('should register itself the passed in router component', () => {
    let render = NestedRoutePlaceholder.renderSync({
      router: routerComponent,
      path: '/some/path',
      component: TestComponent
    })

    const component = render.appendTo(testContainer).getComponent()

    assert(component.getEl() === null, 'Component should not have a rendered body anymore')

    const html = testContainer.innerHTML
    const match = html.match(/test-component/)
    assert(match, 'placeholder div should contain a test component')
  })
})
