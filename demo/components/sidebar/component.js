require('./styles.css')

module.exports = {
  onInput: function (input) {
    this.state = {
      floating: input.floating,
      reveal: input.reveal,
      width: input.width,
      rightSide: input.rightSide,
      showOverlay: true,

      // custom html
      header: input.header,
      body: input.body,
      footer: input.footer
    }
  },

  toggle: function () {
    this.setState('reveal', !this.state.reveal)
    console.log('toggle', this.state.reveal)
  }
}
