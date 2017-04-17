const history = require('../../history')

module.exports = {
  onInput: function (input) {
    if (!input.path) {
      throw new Error('Path must be provided to router-link')
    }
  },

  handleLinkClick: function () {
    history.push(this.input.path)
  }
}
