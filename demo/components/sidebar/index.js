require('./styles.css');

module.exports = require('marko-widgets').defineComponent({
    template: require('./template.marko'),

    init: function() {
    },

    getInitialState: function(input) {
        return {
            floating: input.floating,
            reveal: input.reveal,
            width: input.width,
            rightSide: input.rightSide,
            showOverlay: true,

            // custom html
            header: input.header,
            body: input.body,
            footer: input.footer
        };
    },

    open: function() {
        var self = this;
        if (self.state.pin) {
            throw new Error('marko-drawer: Cannot open a pinned sidebar');
        }
        self.setState('reveal', true);
    },

    close: function() {
        var self = this;
        if (self.state.pin) {
            throw new Error('marko-sidebar: Cannot close a pinned sidebar');
        }
        self.setState('reveal', false);
    }
});
