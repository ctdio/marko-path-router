/* eslint-env mocha */
/* global test */
const assert = require('assert')
const SHOULD_NOT_GET_HERE = new Error('Should not get here.')
const TestComponent = require('../../../../test/util/test-component')
const history = require('../../../history')

describe('router-link component', () => {
  afterEach('reset history to default mode', () => {
    history.setMode('history')
  })

  test('should throw an error if not given a path', (context) => {
    try {
      context.render({})
      throw SHOULD_NOT_GET_HERE
    } catch (err) {
      let match = err.message.match(/Path must be provided/)
      assert(match)
    }
  })

  test('should be able to wrap components if a renderBody is provided', (context) => {
    const output = context.render({
      path: 'some path',
      renderBody: function (out) {
        TestComponent.render({}, out)
      }
    })

    const { component } = output
    const routerLinkEl = component.getEl()
    assert(routerLinkEl.children.length === 1,
      'Routerlink should only have a single child element')

    const testEl = routerLinkEl.children[0]
    assert(testEl.getAttribute('class') === 'test-component')
  })

  test('should be able to pass classes down to anchor element', (context) => {
    const cssClasses = 'some-css-class another-css-class'

    const output = context.render({
      path: 'some path',
      class: cssClasses
    })

    const { component } = output
    const routerLinkEl = component.getEl()
    assert(routerLinkEl.className === cssClasses,
      'Routerlink should only have a single child element')
  })

  test('should prefix output path with "#" if history is set to "hash"', (context) => {
    history.setMode('hash')

    const path = '/some/path'
    const expectedPath = '#' + path

    const { component } = context.render({ path })
    const el = component.getEl()
    const href = el.getAttribute('href')

    assert(href === expectedPath,
      'href should be prefixed with "#"\n' +
      `Actual: ${href}\nExpected: ${expectedPath}`)
  })
})
