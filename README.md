# marko-path-router

[![Build Status](https://travis-ci.org/charlieduong94/marko-path-router.svg?branch=master)](https://travis-ci.org/charlieduong94/marko-path-router)

Client side routing for [Marko](https://github.com/marko-js/marko) that provides support for
wildcards routes, placeholder routes, and nested routes.

### Installation

```bash
npm install --save marko-path-router
```

### Usage

#### Basic Usage

Creating a router is simple. First, you need to define the routes that you want the router to handle.

```js
const routes = [
  { path: '/', component: require('home-component') },
  { path: '/users', component: require('users-component') },
  { path: '/directory', component: require('directory-component') }
]
```

Next, pass in the `routes` and the `initialRoute` that should be rendered to the `Router` component.

```js
const { Router } = require('marko-path-router')

const render = Router.renderSync({
  routes: routes,
  initialRoute: '/'
})

const routerComponent = render.appendTo(targetEl).getComponent()
```

Alternatively, you can pass the data to the `router` tag.

```marko
div.my-app
  div.app-header
    div.header-title -- marko-path-router
  div.app-content no-update
    router routes=state.routes initialRoute='/'
```

In the example above, the `home-component` will be rendered within the `router` component.

To navigate to a route, you can use the provided `router-link` component.

```marko
router-link path='/users'
  -- Go to /users
```

Upon clicking the `router-link`, the router will perform a lookup. If the router has found a match
, it will render the component mapped to the path. If a router does not find a match,
it will emit a `not-found` event.

You can add a listener to the router component and handle `not-found` events accordingly.

```js
routerComponent.on('not-found', () => {
  // handle not found
})
```

Note: If you are rendering the router via the `router` tag, you can add a `key` attribute to it and
retrieve the component via `this.getComponent(routerKey)`.

```marko
  router routes=state.routes initialRoute='/' key='my-router'
```

If needed, you can use the module's `history` wrapper for pushing or replacing state as an alternative
to the `router-link`.

```js
const { history } = require('marko-path-router')

// push browser history
history.push('/users')

// replace current route
history.replace('/directory')
```

The `history` object also exposes the native history's `back`, `forward`, and `go` methods for convenience.

#### Nested Routes

To nest routes, you can provide the `nestedRoutes` attribute for a route. The `path` given to
nested route is appended to it's parent's path when it is created.

```js
const routes = [
  {
    path: '/charts', // '/charts'
    component: require('charts-component'),
    nestedRoutes: [
      { path: '/line', component: require('line-chart-component') }, // becomes '/charts/line'
      { path: '/bar', component: require('bar-chart-component') } // becomes '/charts/bar'
    ]
  },
  { path: '/users', component: require('users-component') }, // becomes: '/users'
]
```

In the example above, navigating to `/charts` will render the `charts-component` within the router.
Navigating to `/charts/line`, will render the charts component and will also pass the component a `renderBody`
function that can be used by the `charts-component` to render the `line-chart-component`. The `renderBody` can be passed
into an `include` tag for rendering, much like with regular component nesting in Marko. (More info on the `include` tag
[here](http://markojs.com/docs/core-tags/#codeampltincludegtcode)).

*`charts-component:`*
```marko
div.charts-showcase
  div.chart-1 key='chart-1'
  div.chart-2 key='chart-2'
  div.main-chart
    if(input.renderBody)
      include(input.renderBody)
```

The router keeps track of the components that it currently has rendered. So, if it finds that there are existing components
that can be reused, it will not perform a render of the entire view.

For example, if we navigate to `/charts/line`, the router will render the charts
component and the line chart component. If we then navigate to `/charts/bar`, the router will simply update the charts component
with a new `renderBody` that will render the bar chart component. So the chart component will not get recreated and remounted to
the DOM.

### Todo:
  - Add support for server side rendering of routes.
