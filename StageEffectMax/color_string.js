inlets = 2;
outlets = 2;
var array = [];


function one() {
	var colorStr = toColorStr(arguments);
	array = [colorStr];
	output();
}

function add(){
	var colorStr = toColorStr(arguments);
	array.push(colorStr);
	output();
}

function clear() {
	array = [];
	output();
}

function output() {
	outlet(0, array);
	outlet(1, array.length);
}

function toColorStr(arg) {
	var colorArr = arrayfromargs(arg);
	var colorStr = colorArr.join(",")
	return colorStr;
}