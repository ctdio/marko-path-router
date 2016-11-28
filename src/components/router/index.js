'use strict';
require('./styles.css');
var history = require('../../history');

module.exports = require('marko-widgets').defineComponent({
    template: require('./template.marko'),

    init: function() {
        var self = this;
        var routes = self.state.routes;

        history.on('change-route', function(event) {
            var component = event.component;
            if (component) {
                var componentState = event.historyState.componentState;
                var renderedComponent = component.render(componentState);
                self.setComponent(renderedComponent);
            }
        });

        var initialRoute;
        for (var i = 0; i < routes.length; i++) {
            var route = routes[i];
            var path = route.path;
            var title = route.title;
            var component = route.component;

            history.registerRoute(path, {
                title: title,
                component: component
            });

            if (!initialRoute && route.initial) {
                initialRoute = route;
            }
        }

        if (initialRoute) {
            console.log('initial Route', initialRoute);
            var initialPath = initialRoute.path;
            history.push(initialPath, {
                title: initialRoute.title,
                path: initialPath,
                componentState: {}
            });
        }
    },

    setComponent: function(component) {
        component.replaceChildrenOf(this.getEl());
    },

    getInitialProps: function(input) {
        console.log('input props', input);
        return input;
    },

    getInitialState: function(input) {
        return {
            routes: input.routes
        };
    }
});
