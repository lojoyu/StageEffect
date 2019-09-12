#!/bin/bash
FILES=sound/*
echo "module.exports.soundFiles = ["
for folder in $FILES
do
	# echo "-- $folder -- "
	for file in $folder/*
	do 
		echo "\"$file\","
	done

done
echo "];"


echo '
module.exports.rgbColors = [
"255, 255, 255", //white
"255, 0, 0",	// r
"0, 255, 0",	// g
"0, 0, 255", 	// b
"0, 253, 255",  //c
"255,64,255",	//m
"255,251,0",	//y
"150,0,150", 	//purple
"255,191,0",	//yellow
]'