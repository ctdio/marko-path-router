require('./styles.css')
var history = require('../../../src/history')
var charts = require('../charts')

module.exports = {
  onMount: function () {
    this.setState('ready', true)
  },

  onInput: function () {
    this.state = {
      showSidebar: true,
      ready: false
    }
  },

  toggleSidebar: function () {
    var sidebar = this.getComponent('sidebar')
    sidebar.toggle();
  },

  handleLinkClick: function (event, el) {
    var route = el.getAttribute('data-route')
    history.push(route, {})
  }
}
