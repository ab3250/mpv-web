/* eslint-disable no-return-assign */
'use strict'
const BasicMPVClient = require('./base').default.BasicMPVClient

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

module.exports = { MPVClient }
