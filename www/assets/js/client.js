/* eslint-disable no-return-assign */
'use strict'

require('net')
// let debug = require('debug')('mpv-ipc');
class BasicMPVClient {
  constructor (socketPath) {
    this.socketPath = socketPath
    this.handlers = {}
    this.commands = {}
    this.request_id = 1
    if (socketPath instanceof Socket) {
      this.socket = socketPath
    } else {
      this.socket = connect(socketPath)
    }
    this.socket.on('connect', () => this.emit('connect'))
    this.socket.on('data', data => this.handleData(data))
    this.socket.on('close', (e) => this.emit('close', e))
    this.socket.on('error', (err) => this.onError(err))
  }

  on (event, handler) {
    this.handlers[event] = this.handlers[event] || []
    this.handlers[event].push(handler)
    return handler
  }

  off (event, handler) {
    this.handlers[event] = this.handlers[event].filter(h => h !== handler)
  }

  emit (event, ...args) {
    // eslint-disable-next-line curly
    if (!(event in this.handlers))
      return
    for (var h of this.handlers[event]) {
      h(...args)
    }
  }

  handleData (data) {
    const events = data.toString().trim().split('\n')
    for (var e of events) {
      // debug('<- ' + e);
      // console.log(e)
      const evt = JSON.parse(e)
      this.handleEvent(evt)
    }
  }

  handleEvent (evt) {
    if (evt.request_id) {
      const [resolve, reject] = this.commands[evt.request_id]
      delete this.commands[evt.request_id];
      (evt.error === 'success') ? resolve(evt.data) : reject(evt.error)
    } else {
      this.emit('event', evt)
      this.emit(evt.event, evt)
    }
  }

  command (...args) {
    const p = new Promise((resolve, reject) => {
      this.commands[this.request_id] = [resolve, reject]
    })
    const command = JSON.stringify({ command: args, request_id: this.request_id })
    this.socket.write(command + '\n')
    this.request_id++
    // debug('-> ' + command);
    return p
  }

  onError (error) {
    if (error.message.indexOf('ECONNREFUSED') > -1) {
      // do recconect
      console.log('Attempting to reconnect shortly')
      setTimeout(() => {
        this.socket = connect(this.socketPath)
        this.socket.on('connect', () => this.emit('connect'))
        this.socket.on('data', data => this.handleData(data))
        this.socket.on('close', (e) => this.emit('close', e))
        this.socket.on('error', (err) => this.onError(err))
      }, 1000)
    } else {
      // error!!!!!!!!!!!
    }
  }
}

function stripFirstWord (str) {
  return str.replace(/^[a-z]+/, '')
}

function toSnakeCase (str) {
  return str.replace(/([a-z])([A-Z])/, '$1_$2').toLowerCase()
}

function toDashCase (str) {
  return str.replace(/([a-z])([A-Z])/, '$1-$2').toLowerCase()
}

/* From https://github.com/mpv-player/mpv/blob/master/DOCS/man/ipc.rst#commands */
const IPC_COMMANDS = [
  'clientname',
  'gettimeus',
  'getproperty',
  'getpropertystring',
  'setproperty',
  'setpropertystring',
  'observeproperty',
  'observepropertystring',
  'unobserveproperty',
  'requestlogmessages',
  'enableevent',
  'disableevent',
  'getversion'
]

class MPVClient extends BasicMPVClient {
  constructor (...args) {
    super(...args)
    this.observe_property_id = 1
    this.proxy = new Proxy(this, {
      get: this._get
    })
    this.cache = {}
    return this.proxy
  }

  _get (target, property, receiver) {
    if (property in target) {
      return target[property]
    } else if (property in target.cache) {
      return target.cache[property]
    } else if (IPC_COMMANDS.includes(property.toLowerCase())) {
      const prop = toSnakeCase(property)
      return target.cache[property] = (...args) => target.command(prop, ...args)
    } else if (property.startsWith('on')) {
      const prop = toDashCase(stripFirstWord(property))
      return target.cache[property] = (...args) => target.on(prop, ...args)
    } else if (property.startsWith('off')) {
      const prop = toDashCase(stripFirstWord(property))
      return target.cache[property] = (...args) => target.off(prop, ...args)
    } else if (property.startsWith('get')) {
      const prop = toDashCase(stripFirstWord(property))
      return target.cache[property] = (...args) => target.command('get_property', prop, ...args)
    } else if (property.startsWith('set')) {
      const prop = toDashCase(stripFirstWord(property))
      return target.cache[property] = (...args) => target.command('set_property', prop, ...args)
    } else if (property.startsWith('observe')) {
      const prop = toDashCase(stripFirstWord(property))
      return target.cache[property] = (...args) => target.observeProperty(prop, ...args)
    } else if (property.startsWith('toggle') || (property.startsWith('cycle') && property !== 'cycle')) {
      const prop = toDashCase(stripFirstWord(property))
      return target.cache[property] = (...args) => target.command('cycle', prop, ...args)
    } else if (property.startsWith('adjust') || (property.startsWith('add') && property !== 'add')) {
      const prop = toDashCase(stripFirstWord(property))
      return target.cache[property] = (...args) => target.command('add', prop, ...args)
    } else if (property.startsWith('scale') || (property.startsWith('multiply') && property !== 'multiply')) {
      const prop = toDashCase(stripFirstWord(property))
      return target.cache[property] = (...args) => target.command('multiply', prop, ...args)
    } else {
      const prop = toDashCase(property)
      return target.cache[property] = (...args) => target.command(prop, ...args)
    }
  }

  observeProperty (name, cb) {
    const propertyID = this.observe_property_id++
    const handle = this.proxy.onPropertyChange(e => {
      if (e.id === propertyID && e.name === name && cb(e.data)) {
        this.proxy.offPropertyChange(handle)
        this.command('unobserve_property', propertyID)
      }
    })
    return this.command('observe_property', propertyID, name).catch(e => { this.proxy.offPropertyChange(handle); throw e })
  }

  play () { this.proxy.setPause(false) }
  pause () { this.proxy.setPause(true) }
  resume () { this.proxy.setPause(false) }
  audioPlay (track) { this.proxy.command('loadfile', track) }
  audioAdd (track) { this.proxy.command('loadfile', track, 'append-play') }
  mute () { this.proxy.setMute(true) }
  unmute () { this.proxy.setMute(false) }
  loop (n) { this.proxy.setLoop(n < 0 ? 'inf' : n) }
  /*
 * Working  commands
 *      playlistShuffle()
 *      playlistClear()
 */

  /* togglePause() handled by proxy */
  /* volume handled by proxy setVolume()/getVolume()/adjustVolume() */
  /* seek handled by proxy seek() */
  /* audio tracks handled by proxy audioAdd()/audioRemove()/setAudio()/cycleAudio()/setAudioDelay() */
  /* subtitle tracks handled by proxy subAdd()/subRemove()/setSub()/cycleSub()/toggleSubVisibility()/setSubVisibility()/setSubDelay()/subSeek()/setSubScale() */
  /* video handled by proxy setFullscreen()/toggleFullscreen()/screenshotToFile()/setVideoRotate()/setVideoZoom()/setBrightness()/setContrast()/setSaturation()/setGamme()/setHue() */
  /* speed handled by proxy setSpeed() */
  /* loading handled by proxy loadlist()/loadfile() */
  /* playlist handled by proxy playlistNext()/playlistPrev()/playlistClear()/playlistRemove()/playlistRemove()/playlistShuffle() */
}

//export { MPVClient }
