module.exports = function (markoCli) {
  markoCli.config.puppeteerOptions = {
    args: [ '--no-sandbox' ]
  }
}
