/**
 * Singleton History object t
 */
var util = require('util');
var EventEmitter = require('events');
var RadixRouter = require('radix-router');

var history = window ? window.history : {};

function History() {
    var self = this;
    var router = self.router = new RadixRouter();

    window.addEventListener('popstate', function(event) {
        let newState = event.state;
        let routeData;
        let component;

        if (newState) {
            routeData = router.lookup(newState.path).data;
            component = routeData.component;
        }

        self.emit('change-route', {
            historyState: newState,
            component: component
        });
    });
}

util.inherits(History, EventEmitter);

History.prototype.push = function(path, componentState) {
    var self = this;
    var route = self.router.lookup(path);
    if (!route.data) {
        throw new Error('Unable to find route ' + path);
    }
    var title = route.data.title;
    var component = route.data.component;
    var params = route.data.params;

    componentState.params = params;

    var state = {
        title: title,
        path: path,
        componentState: componentState
    };

    history.pushState(state, title, path);
    let newState = Object.assign(state, {history: this});

    self.emit('change-route', {
        historyState: state,
        component: component
    });
};

History.prototype.pop = function() {
    history.back();
};

History.prototype.replace = function() {
    history.forward();
};

History.prototype.registerRoute = function(path, routeData) {
    var title = routeData.title;
    var component = routeData.component;

    this.router.insert(path, {
        title: title,
        component: component
    });
};

History.prototype.removeRoute = function(path) {
    return !!self.router.delete(path);
};

History.prototype.getCurrentState = function() {
    return history.state;
};

module.exports = new History();
