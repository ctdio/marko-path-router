
module.exports = {
  onCreate: function () {
    var mountPoint = this.getEl('mount-point')
    var App = require('components/app')
    App.render().replace(mountPoint)
  }
}
