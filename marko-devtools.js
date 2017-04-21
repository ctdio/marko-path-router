const babelTransform = {
  transform: require('lasso-babel-transform'),
  config: {
    babelOptions: {
      presets: [ 'env' ]
    }
  }
}

module.exports = function (markoDevtools) {
  markoDevtools.config.browserBuilder = {
    require: {
      transforms: [ babelTransform ]
    }
  }
}
