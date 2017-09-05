const babelTransform = {
  transform: require('lasso-babel-transform'),
  config: {
    babelOptions: {
      presets: [ 'env' ]
    }
  }
}

module.exports = function (markoCli) {
  markoCli.config.browserBuilder = {
    require: {
      transforms: [ babelTransform ]
    }
  }
}
