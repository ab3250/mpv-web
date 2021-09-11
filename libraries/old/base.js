/* MPV web interface */

'use strict'

import { Socket, connect } from 'net'
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

export default { BasicMPVClient }
