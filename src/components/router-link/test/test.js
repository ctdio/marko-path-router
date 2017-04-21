/* eslint-env mocha */
/* global test */
const assert = require('assert')
const SHOULD_NOT_GET_HERE = new Error('Should not get here.')
const TestComponent = require('../../../../test/util/test-component')

describe('router-link component', () => {
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
    const match = component.getEl().outerHTML.match(/test-component/)
    assert(match, 'Test component should have rendered within the router-link')
  })
})
