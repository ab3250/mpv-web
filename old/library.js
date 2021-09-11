/* eslint-disable no-unused-vars */

function bool (initial) {
  initial = !!initial
  return {
    get current () {
      return initial
    },
    toggle: function () {
      // eslint-disable-next-line no-return-assign
      return initial = !initial
    }
  }
}

function jsonIsValid (testObj) {
  const testStr = JSON.stringify(testObj)
  // eslint-disable-next-line no-useless-escape
  if (/^[\],:{}\s]*$/.test(testStr.replace(/\\["\\\/bfnrtu]/g, '@')
    // eslint-disable-next-line no-useless-escape
    .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
    .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
    //  the json is ok
    return true
  } else {
    //  the json is not ok
    return false
  }
}
const globalStateObject = (() => {
  let _pauseState = true
  let _shuffleState = false
  let _appendState = true
  let _playlist = ''
  const store = {
    get playlist () { return _playlist },
    set playlist (value) { _playlist = value },
    set appendState (value) { _appendState = value },
    get appendState () { return _appendState },
    set shuffleState (value) { _shuffleState = value },
    get shuffleState () { return _shuffleState },
    set pauseState (value) { _pauseState = value },
    get pauseState () { return _pauseState }
  }
  return Object.freeze(store)
})()

// function getNamespace (exports) {
//   for (var item in exports) {
//     global[item] = exports[item]
//   }
// } // paco.getNamespace(paco);

// function shuffle (inputArray) {
//   for (let i = inputArray.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * i)
//     const temp = inputArray[i]
//     inputArray[i] = inputArray[j]
//     inputArray[j] = temp
//   }
// }

function shuffle (inputArray) {
  (function loop (count) {
    if (count === 0) return
    const j = Math.floor(Math.random() * count)
    const temp = inputArray[count]
    inputArray[count] = inputArray[j]
    inputArray[j] = temp
    loop(count - 1)
  })(inputArray.length - 1)
  return inputArray
}

module.exports = {
  bool: bool,
  jsonIsValid: jsonIsValid,
  // getNamespace: getNamespace,
  globalStateObject: globalStateObject,
  shuffle: shuffle
}
