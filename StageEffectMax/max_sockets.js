// --------------------------------------------------------------------------
// max_sockets.js - a generic Node/Express application that serves up the
//                  requested web pages, and manages a socket connection
//                  with any requesting pages. This is part of the Node for
//                  Max system for Max 8.
// --------------------------------------------------------------------------


const Max = require("max-api");
const nameSpace = "/controller";
const io = require('socket.io-client');

var socket = io('https://stage-effect-server1.herokuapp.com'+nameSpace);
//var socket = io('http://localhost:8000'+nameSpace);
var socket;

Max.post("script start");

Max.addHandler('local', () => {
	Max.post("connect to local server");
	socket.disconnect();
	socket = io('http://localhost:8000'+nameSpace);
	addSocketListener();
});

Max.addHandler('server', () => {
	Max.post("connect to server");
	socket.disconnect();
	socket = io('https://stage-effect-server1.herokuapp.com'+nameSpace);
	addSocketListener();
});

function addSocketListener() {
	socket.on('connect', (data) => {
	    socket.on('debug', (message) => {
			Max.post(message)
		});

		socket.on('showClient', (data) => {
			Max.post(data);
		})

	    const sender = function (data) {
			Max.post(data);
			socket.emit('controlData', data)
		};

		Max.addHandler('show', (order) => {
			Max.post("show:" + order);
			socket.emit('showClient', order);
		});

		Max.addHandler('showArr', (...order) => {
			Max.post("show:" + order);
			socket.emit('showClient', order);
		});

		Max.addHandler("controlData", (...args) => {
			Max.post("controlData:" + args[0]);
			sender(args[0]);
		});
	})
}




// function fillShootData(index) {
// 	return {
// 		status: status,
// 		shoot: index, 
// 		compass: 10
// 	}
// }


// function fillData(data) {
// 	default_data = {
// 		status: status,
// 		mode: "blink",
// 		percentage: 1,
// 		keepBlink: 0,
// 		order: 0,
// 		order_to: 0,
// 		random: 0
// 	};
// 	for (var key in data) {
//       default_data[key] = data[key];
//     }
//     default_data["order"] -= 1;
//     default_data["order_to"] -= 1;
//     if (default_data["order"] == -1) default_data["order"] = 100;
//     if (default_data["order_to"] == -1) default_data["order_to"] = 100;
//     return default_data;
// }


// function fillLightData(mode, percentage, colorInd=0, random=0, keepBlink=0, color="") {
	
// 	data = {
// 		status: status,
// 		mode: mode,
// 		percentage: percentage,
// 		keepBlink: keepBlink,
// 		order: colorInd-1,
// 		random: random
// 	};
// 	if (color != "") data.color = color;
// 	return data;
// }

// Max.addHandler(Max.MESSAGE_TYPES.ALL, (handled, ...args) => {
// 	if (!handled) {
// 		Max.post('No client connected.')
// 		// just consume the message
// 	}
// 	Max.post('client connected.')
// });

//console.log("setting up max handlers");

