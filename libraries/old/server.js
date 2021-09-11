/*  TODO: add loop button
add volume display
add home button
add track info
change ajax-script test substring - 31 => removes ip
bad because ip not static length
*/
/* eslint-disable no-undef */
'use strict'
// imports
import { socketFile, acceptedFiles, musicLibPath, pauseStr, playStr,
         fwdStr, backStr, mode2Str, mode1Str, orderedStr, randomStr,
         refreshStr, excludeRegExp, audioFilesRegExp } from './variables.js'
import { MPVClient } from './client.js'
import { exec } from 'child_process'
const mpvObj = execChildProcess('mpv', {}) //  mpvObj
const player = new MPVClient(socketFile)
import { readdirSync } from 'fs'
import express, { json, static } from 'express'
import serveIndex from './serve-index.js'
import { join } from 'path'
const app = express()
import { globalStateObject } from './library.js'
import { shuffle } from './library.js'
//  *********************************************************

app.get('/connect', function (req, res) { // sse setup
  res.writeHead(200,
    {
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache'
    })
  res.write('data: My message\n\n')
  setInterval(function () {
    const playlist = globalStateObject.playlist // debug
    res.write(playlist)
  }, 500)
  player.command('disable_event', 'all')
    .then(() => { player.command('enable_event', 'playback-restart') })
    .then(() => { player.observePlaylist(() => {}) })
    .then(() => { })
})

player.on('event', (res) => { // register event listener for player
  (async () => { globalStateObject.playlist = await getPlaylist() })()
})

app.use(json()) // allows body parsing

app.get(acceptedFiles, function (req, res) { // apt.get music files
  // string for load file
  var filenameString = musicLibPath + unescape(req.url.substring(6, req.url.length))
  // send music files to socket
  if (globalStateObject.appendState) {
    player.audioAdd(filenameString)
  } else {
    player.audioPlay(filenameString)
  }
})

app.use('/assets', static(join(__dirname, 'assets')))// create virtual directory for scripts

process.on('SIGINT', function () { // ctrl-c
  console.log('\nShutting Down from SIGINT (Ctrl-C)\n')
  // some other closing procedures go here
  player.close() // close player
  mpvObj.kill() // close mpv
  process.exit(1)
})

app.post('*/B4FF2058', function (req, res) { // app.get for mode change
  let data
  //  removes dummy filename, trailing '/' and %20
  const url = musicLibPath + unescape(req.url.substring(0, req.url.length - 8))
  switch (req.body.btnID) { // return json obj based on btnID and do misc support functions
    case 'pauseBtn':
      (async () => {
        await player.togglePause()
        completeXHR(await player.getProperty('pause') ? pauseStr : playStr, res)
      })()
      break
    case 'forwardBtn': // playlist position not last
      (async () => {
        let result2 = 0
        const result1 = await player.getPlaylistCount()
        if (result1 !== 0) result2 = await player.getPlaylistPos() // no playlist => no position
        if (result1 - result2 - 1 > 0) await player.playlistNext() // if last track no next
      })()
      completeXHR(fwdStr, res)
      break

    case 'backBtn': // playlist position not first
      data = backStr;
      (async function () {
        let result2 = 0
        const result1 = await player.getPlaylistCount()
        if (result1 !== 0) result2 = await player.getPlaylistPos() // no playlist => no position
        if (result2 !== 0) await player.playlistPrev() // if first track no previous
      })()
      completeXHR(data, res)
      break
    case 'modeBtn':
      data = globalStateObject.appendState ? mode2Str : mode1Str
      globalStateObject.appendState = !globalStateObject.appendState
      completeXHR(data, res)
      break
    case 'shuffleBtn':
      data = globalStateObject.shuffleState ? orderedStr : randomStr
      globalStateObject.shuffleState = !globalStateObject.shuffleState
      completeXHR(data, res)
      break
    case 'clearBtn':
      (async () => { await player.playlistClear() })()
      completeXHR('{"btnID":"clearBtn"}', res)
      break
    case 'refreshBtn':
      data = refreshStr
      completeXHR(data, res)
      break
    case 'playAllBtn':
      completeXHR('{"btnID":"stopBtn"}', res)
      playAll(url, globalStateObject.shuffleState, globalStateObject.appendState)
      break
    case 'stopBtn':
      (async () => { await player.command('stop') })()
      completeXHR('{"btnID":"stopBtn"}', res)
      break
    case 'plusBtn':
      player.adjustVolume(5)
      completeXHR('{"btnID":"default"}', res)
      break
    case 'minusBtn':
      player.adjustVolume(-5)
      completeXHR('{"minusID":"default"}', res)
      break
    case 'muteBtn':
      player.toggleMute()
      completeXHR('{"btnID":"default"}', res)
      break
    default:
      completeXHR('{"btnID":"default"}', res)
      break
  }
})

/**
 * Serve URLs like /ftp/thing as public/ftp/thing
 * The express.static serves the file contents
 * The serveIndex is this module serving the directory
 */
app.use('/frame', static('Music'), serveIndex('Music', {
  filter: function (file, pos, list) { return !(excludeRegExp.test(file)) },
  icons: true,
  template: './assets/templeteFile.html',
  stylesheet: './assets/style.css',
  view: 'details'
}))

app.use('/', static(join(__dirname, '/')))

app.listen(8080) // Listen for http request

function execChildProcess (linuxCommand, linuxArguments) {
  // console.log(linuxCommand + ' ' + linuxArguments)
  const childObj = exec(linuxCommand, {}, function (error, stdout, stderr) { // execChildProcess
    if (error) {
      console.log(error.stack)
      console.log('Error code: ' + error.code)
      console.log('Signal received: ' + error.signal)
    }
    console.log('Child Process STDOUT: ' + stdout)
    console.log('Child Process STDERR: ' + stderr)
  })
  return childObj
}
//* finish up xhr after buttons processed
function completeXHR (dataXHR, res) {
  res.contentType('text')
  res.send(dataXHR)
  res.end()
}

/*
   *  req.url = /Albums%20A-J/America/America/00%20-%20Play%20All
   *  req.url unescaped = /Albums A-J/America/America/00 - Play All
   *  musicLibPath = musicLibPath : "/media/ab/nas/Multimedia/Music",
   *  sentPath = /media/ab/nas/Multimedia/Music/Albums A-J/America/America/00 - Play All
   *  dummy file name = 00 - Play All
   */

function playAll (url, shuffleFlag, append) { // play all tracks in folder
  var fileList = readdirSync(url) // read directory
  var trimmedFileList = fileList.filter(file => audioFilesRegExp.test(file)) //  keep only audio files from file list
  if (trimmedFileList.length === 0) return
  if (shuffleFlag)shuffle(trimmedFileList) // randomize
  trimmedFileList.forEach(function (value, index, col) { // no append-play on first song clears old playlist
    col[index] = url + value
    append || index !== 0 ? player.audioAdd(col[index]) : player.audioPlay(col[index])
  })
}

async function getPlaylist () {
  const playlistArr = []
  const count = await player.command('get_property', 'playlist/count')
  for (let i = 0; i < count; i++) {
    const obj2 = await player.command('get_property', 'playlist/' + i)
    obj2.filename = obj2.filename.substring(obj2.filename.lastIndexOf('/') + 1)
    playlistArr.push(obj2)
  }
  return 'data: ' + JSON.stringify(playlistArr) + '\n\n'
}
