import React, {Component} from "react";
// import Anime from 'react-anime';
import io from 'socket.io-client'
import {hot} from "react-hot-loader";
import "./App.css";
import {soundFiles, rgbColors} from "./constList.js"
import AnimeBox from "./animeBox.js"
import Tone from "Tone"
import {OneEuroFilter} from'./filter.js'
//import { Players, Part, Time } from 'tone';

const SocketNamespace = "/receiver";


class App extends Component {

	state = {
		socketID: "",
    	//uuid: sessionStorage.getItem("StageEffectUUID") || genUUID(),
        endpoint: SERVER+SocketNamespace,
        refreshAnime: false,
        refreshMusic: false,
        socketData: {},
        lightData: {},
        soundData: {},
        opa: "rgba(0,0,0,1)",
        opacity: 0,
    };

    componentDidMount() {
    	console.log(`soundFiles: ${soundFiles.length}`);
        let {endpoint} = this.state;

        const socket = io(endpoint);
        socket.on("connect", () => {
        	console.log("connected to server");
        	socket.emit('connected', 'hi');

         	//this.setupBeforeUnloadListener(socket);
         	this.setState({socketID: socket.id});
         	socket.on("debug", (data) => {
         		console.log(`<socket> ${data}`);
         	})

         	socket.on("controlData", (data) => {
         		//console.log(`<socket> controlData!`);
         		console.log(`<data> ${JSON.stringify(data)}`);
         		let {light, sound} = this.handleSocketData(data);
         		console.log(`<light data>  ${JSON.stringify(light)}`)
         		this.setState((prevState) => ({
         			lightData: jsonCopy(light),
         			soundData: jsonCopy(sound),
         			refreshMusic: sound == {} ? 
         					prevState.refreshMusic : !prevState.refreshMusic,
					refreshAnime: sound == {} ? 
							prevState.refreshAnime : !prevState.refreshAnime
				}));

         	});
        	
        });

    }

    handleSocketData(data) {
    	//console.log("handleSocketData");
    	var sound = "sound" in data ? this.handleSoundData(data.sound) : {};
    	var light = "light" in data ? this.handleLightData(data.light) : {};
    	if (!"color" in light && "order" in sound) {
    		light.color = rgbColors[sound.order % rgbColors.length];
    	}
    	if ("delay" in light && "order" in sound) {
    		sound.delay = light.delay;

    	}
    	if ("mode" in light && "order" in sound) {
    		sound.mode = light.mode;

    	}
    	if ("mode" in light && "stop" in sound) {
    		if (light.mode == "follow") light = {};
    	}
    	// TODO: if color mode == follow ? 

    	return {light: light, sound: sound};
    }

    handleSoundData(sound) {
    	//if order not in range => no sound!
    	console.log(`handleSoundData ${sound.order}`);
    	if (!inArrRange(sound.order, soundFiles.length))
    		return {};

    	// if orderTo not in range or < order: to order
    	if (!inArrRange(sound.orderTo, soundFiles.length) 
    		|| sound.orderTo < sound.order)
    		sound.orderTo = sound.order;
    	
    	//calculate random
	    sound.order = sound.order + 
	    		Math.floor(Math.random()*(sound.orderTo-sound.order));
	    console.log(`order ${sound.order}`); 

	    if ("stop" in sound) {
    		if (sound.stop == "*") delete sound.stop;
    	}
	    return sound;
    }

    handleLightData(light) {
    	if (light.mode == "none") return {};
    	if ("color" in light) {
    		if (light.color == "*") delete light.color;
    	}
    	light.delay = Math.random()*light.delay;
    	return light;
    }

    changeHandler(v, t) {
    	//console.log(`changeHandler: ${v}`);
    	t.setState({opacity: v});
    }

	render(){

		let {refreshAnime, refreshMusic, socketData, opa, lightData, soundData, opacity} = this.state;
		
		return(
			<div>
				<AnimeBox refresh={refreshAnime} data={lightData} 
				opa={opa} opacity={opacity}></AnimeBox>
				<button onClick={this.clickButton}></button>
				<MusicBox refresh={refreshMusic} data={soundData} onChange={this.changeHandler} parent={this}></MusicBox>
			</div>
		);
	}

	setupBeforeUnloadListener = (socket) => {
        window.addEventListener("beforeunload", (event) => {
            event.preventDefault();
            socket.emit('disconnected', {
		        uuid: this.state.uuid
	    	})
	    	return event;
        });
    };

    clickButton = () => {
    	//console.log(`click ${this.state.refreshAnime}`);
    	var r = Math.floor(Math.random()*255);
    	var g = Math.floor(Math.random()*255);
    	var b = Math.floor(Math.random()*255);
    	//testPlayer[0].start();
    	this.setState((prevState) => ({
			refreshAnime: !prevState.refreshAnime,
			refreshMusic: !prevState.refreshMusic,
			opa: `rgba(${r},${b},${b},1)`
			//opa: `rgba(255,255,0,1)`
		}));
    }
}



class MusicBox extends Component {

	state = Object.assign({
		userInput: 0,
		nowOrder: 0,
		euro: null,
		soundInterval: null,
		//timeoutFunc: null,
		},soundPreload());

	shouldComponentUpdate(nextProps, nextState) {

		if (nextProps.refresh && !this.state.userInput) {
			this.state.soundPlayer[0].start();
			this.setState({userInput: 1});
		}
		if ("stop" in nextProps.data) {
			this.stopAll();
			return false;
		}
		return nextProps.refresh !== this.props.refresh;
	}

	render() {
		let {data} = this.props;
		let {soundPlayer, nowOrder} = this.state;
		console.log(`<sound Data>${JSON.stringify(data)}`);
		
		//soundPlayer[nowOrder].stop();
		if ("order" in data) {
			if (data.delay > 0) {
				setTimeout(() => {
					this.playSound(data.order, data.mode);
				}, data.delay);
			} else {
				this.playSound(data.order);
			}
		}

		return (<div>{this.state.nowOrder}</div>);
		
	}

	stopAll() {
		this.state.soundPlayer.forEach((e) => {
			e.stop();
		}) 
	}

	playSound(order, mode) {
		this.state.soundPlayer[order].start();
		this.state.nowOrder = order;
		console.log(`this.state.nowOrder ${this.state.nowOrder}`);
		// if (mode == "follow") 
		this.genAlphaFromSound(order);
		//this.state.nowOrder ++;
		//this.setState({nowOrder: order});
	}

	genAlphaFromSound(order) {
		console.log("genAlphaFromSound");
		//this.setState({euro: new OneEuroFilter(200)});
		this.state.euro = new OneEuroFilter(200);
		//let {euro, waveform, soundInterval} = this.state;
		//let euroOut = 0;
		//euro = new OneEuroFilter(200);
		if (this.state.soundInterval != null) clearInterval(this.state.soundInterval);
		//setState

		this.state.soundInterval = setInterval(this.calculateEuro, 100, this);
		
	}

	calculateEuro(t) {
		var multi = 7;
		//console.log(JSON.stringify(t.state));
		let {nowOrder, waveform, euro} = t.state;
		let euroOut = 0;
		if (t.state.soundPlayer[nowOrder].state == "stopped") {
			//TODO: toblack

		} else {
			var waveData = waveform.getValue();
			//console.log(`${waveData}`);
            var max = Math.max.apply(Math, waveData);
            var min = Math.min.apply(Math, waveData)*-1;
            var r = Math.max(max, min);
            r *= multi;
            if (r > 1) {
                r = 1.;
            } else if (r < 0.2 && r != 0) {
                r = 0.2;
            }
            //console.log(`r: ${r*1000}`);
            euroOut = 1.0*euro.filter(r);
            //console.log(`euro: ${euroOut}`);
		}
		t.props.onChange(euroOut, t.props.parent);
		
	}
}



const soundPreload = () => {
	var meter = new Tone.Meter('level');
	var fft = new Tone.Analyser('fft', 64);
	var waveform = new Tone.Analyser('waveform', 32);
	var soundPlayer = [];

	for (var i=0; i<soundFiles.length; i++) {
		var temp = new Tone.Player(soundFiles[i]).connect(meter).connect(waveform).connect(fft).toMaster();
		soundPlayer.push(temp);
	}
	return {meter: meter, fft: fft, waveform: waveform, soundPlayer:soundPlayer};
}

const inArrRange = (num, len) => {
	//console.log(num >= 0 && num < len);
	return num >= 0 && num < len;
}

const genUUID = () => {
	var d = Date.now();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        d += performance.now(); //use high-precision timer if available
    }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    sessionStorage.setItem("StageEffectUUID", uuid);
    return uuid;
}

const jsonCopy = (jsonObj) => {
  return JSON.parse(JSON.stringify(jsonObj));
}


export default hot(module)(App);