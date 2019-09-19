import React, {Component} from "react";
import io from 'socket.io-client'
import {hot} from "react-hot-loader";
import Tone from "Tone"
import {soundFiles, rgbColors, soundFadeOut} from "./constList.js"
import {OneEuroFilter} from'./filter.js'
import AnimeBox from "./animeBox.js"
import "./App.css";
//import { Players, Part, Time } from 'tone';

const SocketNamespace = "/receiver";
//const SERVER = "https://stage-effect-server1.herokuapp.com";

class App extends Component {

	state = {
		socketID: "",
    	uuid: sessionStorage.getItem("StageEffectUUID") || genUUID(),
        endpoint: SERVER+SocketNamespace,
        refreshAnime: false,
        refreshMusic: false,
        socketData: {},
        lightData: {},
        soundData: {},
        //opa: "rgba(0,0,0,1)",
        opa: -1,
        opacity: 0,
    };

    componentDidMount() {
    	console.log(`soundFiles: ${soundFiles.length}`);
        let {endpoint} = this.state;

        const socket = io(endpoint);
        socket.on("connect", () => {
        	console.log("connected to server");
        	socket.emit('connected', {
        		uuid: this.state.uuid
        	});

         	//this.setupBeforeUnloadListener(socket);
         	this.setState({socketID: socket.id});
         	socket.on("debug", (data) => {
         		console.log(`<socket> ${data}`);
         	})

         	socket.on("controlData", this.receiveControlData.bind(this));
        	
        });

    }

    receiveControlData(data) {
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
    }

    handleSocketData(data) {
    	//console.log(rgbColors);
    	var sound = "sound" in data ? this.handleSoundData(data.sound) : {};
    	var light = "light" in data ? this.handleLightData(data.light) : {};
    	console.log(`<sound> ${JSON.stringify(sound)}`);
    	console.log(`<light> ${JSON.stringify(light)}`);

    	if (!("color" in light) && "order" in sound) {
    		console.log(`color: ${rgbColors[sound.order % rgbColors.length]}`);
    		light.color = rgbColors[sound.order % rgbColors.length];
    	}
    	if ("color" in light && "order" in sound) {
    		if (light.color == "*") {
    			console.log(`color: ${rgbColors[sound.order % rgbColors.length]}`);
    			light.color = rgbColors[sound.order % rgbColors.length];
    		}
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

    	if (!inArrRange(sound.order, soundFiles.length)) {

    		if (!("volume" in sound))
    			return {};
    		else {
    			delete sound.order;
    			return sound;
    		}
    	}

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

    changeHandler(v) {
    	//console.log(`changeHandler: ${v}`);
    	this.setState({opacity: v});
    }

	render(){

		let {refreshAnime, refreshMusic, socketData, opa, lightData, soundData, opacity} = this.state;
		
		return(
			<div id="wrap">
				<AnimeBox refresh={refreshAnime} data={lightData} 
				opa={opa} opacity={opacity}></AnimeBox>
				
				<MusicBox v={opa} refresh={refreshMusic} data={soundData} onChange={this.changeHandler.bind(this)} parent={this}></MusicBox>
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
    	console.log(`click ${this.state.refreshAnime}`);
    	var r = Math.floor(Math.random()*255);
    	var g = Math.floor(Math.random()*255);
    	var b = Math.floor(Math.random()*255);
    	//testPlayer[0].start();
    	if (JSON.stringify(this.state.soundData) != "{}") {
    		this.setState((prevState) => ({
				refreshMusic: !prevState.refreshMusic,
			}));
    	}
    	if (JSON.stringify(this.state.lightData) != "{}") {
    		this.setState((prevState) => ({
				refreshAnime: !prevState.refreshAnime,
			}));
    	}
  //   	this.setState((prevState) => ({
		// 	refreshAnime: !prevState.refreshAnime,
		// 	refreshMusic: !prevState.refreshMusic,
		// 	//opa: `rgba(${r},${b},${b},1)`
		// 	//opa: `rgba(255,255,0,1)`
		// 	opa: prevState.opa*10
		// }));
		//console.log(rgbColors);
    }
}



class MusicBox extends Component {


	constructor() {
		super();
		this.state = Object.assign({
			nowOrder: 0,
			euro: null,
			soundInterval: null,
			style: {border: "0px"},
			buttonTxt: "LOADING..."
			//timeoutFunc: null,
			},soundPreload());
		Tone.Buffer.on('load', this.loadFinish);
	}

	loadFinish = () => {
		this.setState({buttonTxt: "START", style:{}});
	}
	

	shouldComponentUpdate(nextProps, nextState) {
		if ("stop" in nextProps.data) {
			console.log(`<stop> stop music`);
			this.stopAll();
			return false;
		}
		return (nextProps.refresh !== this.props.refresh) ||
				(nextState.style !== this.state.style);
	}

	render() {
		let {data} = this.props;
		let {style, buttonTxt} = this.state;
		let {soundPlayer, nowOrder} = this.state;
		console.log(`<sound Data> ${JSON.stringify(data)}`);
		
		//soundPlayer[nowOrder].stop();
		if ("order" in data) {
			if (data.delay > 0) {
				setTimeout(() => {
					this.playSound(data);
				}, data.delay);
			} else {
				this.playSound(data);
			}
		}
		else if ("volume" in data) {
			console.log(`<volume> ${data.volume}`);
			this.state.soundPlayer[nowOrder].volume.value = data.volume;
		}

		
		return (<button id="soundBtn" style={style} onClick={this.clickButton}>
					{buttonTxt}
				</button>);
		
	}

	clickButton = () => {
		if (this.state.buttonTxt != "START") return;
		console.log("click");
		let data = {order:0, mode:0, volume:0};
		this.setState({style: {display: "none"}});
		this.playSound(data);
	}

	stopAll() {
		this.state.soundPlayer.forEach((e) => {
			e.stop();
		}) 
	}

	playSound(data) {
		let {order, mode, volume} = data;
		this.state.soundPlayer[order].volume.value = volume;
		this.state.soundPlayer[order].start();
		this.state.nowOrder = order;
		console.log(`this.state.nowOrder ${this.state.nowOrder}`);
		if (mode == "follow") 
		//DEBUG: uncomment!
			this.genAlphaFromSound(order);
		//this.state.nowOrder ++;
		//this.setState({nowOrder: order});
	}

	genAlphaFromSound(order) {
		console.log("genAlphaFromSound");
		//console.log(`<v> ${this.state.soundPlayer[order].volume.value}`);
		//this.setState({euro: new OneEuroFilter(200)});
		this.state.euro = new OneEuroFilter(200);
		//let {euro, waveform, soundInterval} = this.state;
		//let euroOut = 0;
		//euro = new OneEuroFilter(200);
		if (this.state.soundInterval != null) clearInterval(this.state.soundInterval);
		//TODO: setState

		this.state.soundInterval = setInterval(this.calculateEuro, 100, this);
		
	}

	calculateEuro = () => {
		var multi = 7;
		//console.log(JSON.stringify(t.state));
		let {nowOrder, waveform, euro} = this.state;
		let euroOut = 0;
		if (this.state.soundPlayer[nowOrder].state == "stopped") {
			//TODO: toblack
			clearInterval(this.state.soundInterval);
			//TODO: setState
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
		this.props.onChange(euroOut, this.props.parent);
		//this.state.soundPlayer[nowOrder].volume.value = this.props.v;
		//console.log(`<volume>: ${this.state.soundPlayer[nowOrder].volume.value}`);
	}
}


const soundPreload = () => {
	var meter = new Tone.Meter('level');
	var fft = new Tone.Analyser('fft', 64);
	var waveform = new Tone.Analyser('waveform', 32);
	var soundPlayer = [];

	for (var i=0; i<soundFiles.length; i++) {
		var temp = new Tone.Player({
			"url": soundFiles[i],
			"fadeOut": soundFadeOut[i]
			}).connect(meter).connect(waveform).connect(fft).toMaster();
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