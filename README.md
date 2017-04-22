# marko-path-router

[![Build Status](https://travis-ci.org/charlieduong94/marko-path-router.svg?branch=master)](https://travis-ci.org/charlieduong94/marko-path-router)

Client side routing for [Marko](https://github.com/marko-js/marko) that provides support for
wildcard, placeholder, and nested routes.

### Installation

```bash
npm install --save marko-path-router
```

### Usage

#### Creating the router

Creating a router is simple. First, you need to define the routes that you want the router to handle.
Each route must have a `path` and a `component`.

```js
const routes = [
  { path: '/', component: require('src/components/home') },
  { path: '/users', component: require('src/components/users') },
  { path: '/directory', component: require('src/components/directory') }
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

**Note:** It is recommended that the router is placed within a element that is marked with `no-update`.
This will ensure that the router will not get rerendered by it's parent and will prevent
the rendered view from being lost because of actions happening outside of the router.

#### Navigation

To navigate to a route, you can use the provided `router-link` component.

```marko
router-link path='/users'
  -- Go to /users
```

Upon clicking the `router-link`, the router will perform a lookup. If the router has found a match
, it will render the component mapped to the path and emit an `update` event. If a router does not find a match
it will emit a `not-found` event.

You can add a listener to the router component and handle events accordingly.

```js
routerComponent.on('update', () => {
  // handle router update
})

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

You can nest routes by providing the optional `nestedRoutes` attribute for a route. The `path` given to
nested route is appended to it's parent's path when it is created. This can be added to any route, so you
have as many layers as you desire.

```js
const routes = [
  {
    path: '/charts', // path: '/charts'
    component: require('src/components/charts'),
    nestedRoutes: [
      { path: '/line', component: require('src/components/line-chart') }, // path: '/charts/line'
      { path: '/bar', component: require('src/components/bar-chart') } // path: '/charts/bar'
    ]
  },
  { path: '/users', component: require('src/components/users') }, // path: '/users'
]
```

In the example above, navigating to `/charts` will only render the `charts` component.
Navigating to `/charts/line`, will render the `charts` component and will also pass the component a `renderBody`
function that can be used by the `charts` component to render the `line-chart` component. The `renderBody` can be passed
into an `include` tag for rendering, much like with regular component nesting in Marko. (More info on the `include` tag
[here](http://markojs.com/docs/core-tags/#codeampltincludegtcode)).

Below is an example of how the `charts` component can allow for the `line-chart` component to rendered.

*`src/components/charts/index.marko:`*
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

For example, if we navigate to `/charts/line`, the router will render the `charts` component and the `line-chart` component.
If we then navigate to `/charts/bar`, the router will simply update the existing `charts` component
with a new `renderBody` that will render the `bar-chart` component. So there is no unnecessary rerendering and remounting of
components.

### Todo:
  - Add support for server side rendering of routes.
