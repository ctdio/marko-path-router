# marko-path-router

[![Build Status](https://travis-ci.org/charlieduong94/marko-path-router.svg?branch=master)](https://travis-ci.org/charlieduong94/marko-path-router)
[![Greenkeeper badge](https://badges.greenkeeper.io/charlieduong94/marko-path-router.svg)](https://greenkeeper.io/)

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

In the example above, the `home` component will be rendered within the `router` component.

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
nested route is appended to it's parent's path when the routing tree is built. This can be added to any route, so you
have as many layers as you desire.

```js
const routes = [
  {
    path: '/charts',
    component: require('src/components/charts'),
    nestedRoutes: [
      { path: '/line', component: require('src/components/line-chart') },
      { path: '/bar', component: require('src/components/bar-chart') }
    ]
  },
  { path: '/users', component: require('src/components/users') },
]
```

This configuration will create the following routes:
  - `/charts`
  - `/charts/line-chart`
  - `/charts/bar-chart`
  - `/users`

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

#### Placeholder routes

Placeholders can be placed into a route by starting a segment of the route with a colon `:`.

For example, let's define the following routes:

```js
const routes = [
  { path: '/users/:userId', component: require('src/components/user') },
  {
    path: '/groups',
    component: require('src/components/group-list'),
    nestedRoutes: [
      { path: '/:groupId', component: require('src/component/group') }
    ]
  },
]
```

With a router using the above routes:
  - Navigating to `/users/1` or `/users/8bdc5071-7de1-4282-af12-f6f0a9c431f1` will render the `user` component.
  - Navigating to `/users`, `/users/`, or `/users/3/description` will miss and cause the router to emit a `not-found` event.
  - Navigating to `/group`, will render the `group-list` component and navigating to `/group/26` or `/group/8bdc5071-7de1-4282-af12-f6f0a9c431f1`
  will render the `group` component as a child of `group-list`.

**Note:** The names that are given to placeholder routes do not matter (you should still give them good names though).
The placeholder values will be added as part of the `input` to the router component under the `params` attribute.
The `params` are provided as an array with its contents sorted by the order the placeholders are defined on
the route's path.

For example, with a route defined as `/orgs/:organization/groups/:groupId`, navigating to
`/orgs/test-organization/groups/test-group` will render a component with `input.params` defined as

```js
[ 'test-organization', 'test-group' ]
```

#### Wildcard routes

Wildcard routes can be configured by adding a `/**` to the end of a route. These will act as a catch-all.

```js
const routes = [
  {
    path: '/user',
    component: require('src/components/user'),
    nestedRoutes: [
      { path: '/info', component: require('src/component/user-info') }
      { path: '/**', component: require('src/component/user-catch-all') }
    ]
  },
  // catch everything else
  { path: '/**', component: require('src/component/catch-all') }
]
```

With the above configuration:
  - Navigating to `/user` will render the `user` component.
  - Navigating to `/user/info` will render the `user` component with the `user-info` component rendered as a child.
  - Navigating to `/user/2`, or `/user/some/path/that/does-not/exist` will render the `user` component with the `user-catch-all` component rendered as a child.
  - Any other route will be caught by the wildcard route and will render the `catch-all` component.
