const history = require('../../../src/history')

module.exports = {
  handleClick: function () {
    history.push('/deep-nested-chart', {
      cobrowse: true
    })
  }
}
