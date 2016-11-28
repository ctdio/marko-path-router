require('./styles.css');
var history = require('../../../src/history');

module.exports = require('marko-widgets').defineComponent({
    template: require('./template.marko'),

    getInitialState: function() {
        return {
            showSidebar: false,
            homeComponent: require('components/home'),
            chartsComponent: require('components/charts'),
            beerComponent: require('components/beer')
        };
    },

    showSidebar: function() {
        this.setState('showSidebar', !this.state.showSidebar);
    },

    handleLinkClick: function(event, el) {
        var route = el.getAttribute('data-route');
        history.push(route, {});
    }
});
