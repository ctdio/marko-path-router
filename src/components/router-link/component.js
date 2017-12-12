/**
 * This is a simple link component that allows for easy
 * route changes without having to manually push data to
 * the history object.
 */
const history = require('../../history')
const modifyPath = require('../../util/modifyPath')

module.exports = {
  onInput: function (input) {
    if (!input.path) {
      throw new Error('Path must be provided to router-link')
    }

    input.modifiedPath = modifyPath(history, input.path)
  },

  handleLinkClick: function (event) {
    event.preventDefault()
    history.push(this.input.path)
  }
}
