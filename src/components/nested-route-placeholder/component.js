/**
 * The purpose of this component is to act as a placeholder
 * for nested components before they are ready to be rendered.
 * This is done as a way to gain access to a mounted component
 * during router's rendering algorithm and facilitates
 * the tracking of components.
 *
 * Upon mounting, this component will be replaced by the
 * component that was originally intended to be rendered.
 */
module.exports = {
  onMount: function () {
    let component = this.state.component
    let router = this.state.router
    let path = this.state.path
    let componentInput = this.state.componentInput

    let render = component.renderSync(componentInput)
    render.replace(this.getEl())

    try {
      router.register(path, render.getComponent())
    } catch (err) {
      console.warn('No component to retrieve at path:', path)
    }
  },

  onInput: function (input) {
    this.state = {
      path: input.path,
      component: input.component,
      componentInput: input.componentInput,
      router: input.router
    }
  }
}
