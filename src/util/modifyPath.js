const HASH_MODE = 'hash'

/**
 * changes the path depending on the mode
 */
function modifyPath (history, path) {
  let newPath
  const mode = history.getMode()

  if (mode === HASH_MODE) {
    newPath = '#' + path
  } else {
    newPath = path
  }

  return newPath
}

module.exports = modifyPath
