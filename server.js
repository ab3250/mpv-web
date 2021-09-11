/*

*/
// const socketFile = '/tmp/mpvsocket'
// const MPVClient = require('./www/assets/js/client.js')
// const exec = require('child_process').exec
// const readdirSync = require('fs').readdirSync

// const mpvObj = exec('mpv', {}) //  mpvObj
// const player = MPVClient(socketFile)
//import { readdirSync } from 'fs'
const mpvAPI = require('node-mpv')
const mpv = new mpvAPI()
async function mainloop()
{
try{
	await mpv.start()
	// loads a file
	await mpv.load('http://localhost:8000/Music/car/CACTUS-DayForNight.flac');
	// file is playing
	// sets volume to 70%
	await mpv.volume(50);
  }
  catch (error) {
	// handle errors here
	console.log(error);
  }
}

mainloop()
/* */
const WSServer = require('ws').Server
const WSSrv = new WSServer({port: 8080}); // the webSocket server
let clients = new Array;         // list of client connections

// ------------------------ webSocket Server functions
function handleConnection(client, request) {
	console.log("New Connection");        // you have a new client
	clients.push(client);    // add this client to the clients array

	function endClient() {
		// when a client closes its connection
		// get the client's position in the array
		// and delete it from the array:
		var position = clients.indexOf(client);
		clients.splice(position, 1);
		console.log("connection closed");
	}

	// if a client sends a message, print it out:
	function clientResponse(data) {
		console.log(request.connection.remoteAddress + ': ' + data);
		broadcast(request.connection.remoteAddress + ': ' + data);
	}

	// set up client event listeners:
	client.on('message', clientResponse);
	client.on('close', endClient);
}

// This function broadcasts messages to all webSocket clients
function broadcast(data) {
	// iterate over the array of clients & send data to each
	for (c in clients) {
		clients[c].send(JSON.stringify(data));
	}
}

// listen for clients and handle them:
WSSrv.on('connection', handleConnection);
