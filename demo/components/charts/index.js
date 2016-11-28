const history = require('../../../src/history');

module.exports = require('marko-widgets').defineComponent({
    template: require('./template.marko'),

    init: function() {
        var self = this;
        self.history = self.state.history;
    },

    getInitialState: function(input) {
        return {
            history: input.history
        };
    },

    handleClick: function() {
        history.push('/route', {
            cobrowse: true
        });
    }
});
