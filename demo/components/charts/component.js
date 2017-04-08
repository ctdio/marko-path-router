const history = require('../../../src/history')

module.exports = {
  handleClick: function () {
    history.push('/beer', {
      cobrowse: true
    })
  }
}
