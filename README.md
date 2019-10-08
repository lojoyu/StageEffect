# StageEffect

a website that could be controlled to light/play sound remotely.

## How to control remotely

1. Connect to [server](https://stage-effect-server1.herokuapp.com) by socket.io while registering in namespace `controller`

2. Send JSON data:
```javascript
{
	mode: {
		type: ...,
		percentage: ...,
		interval: ..., 
		order: ...
	},
	light: {
		mode: ...,
		alpha: ..., 
		color: ...,
		loopTime: ...,
		duration: ...,
		endDelay: ...,
		random: ...
	}, 
	sound: {
		order: ...,
		orderTo: ...,
		stop: ...,
		volume: ...
	}
}
```

### mode
* **type**: 

    \<string> could be either `normal` or `taketurn`.

* **percentage**: 
    how many percentage of website will receive this command.

    \<float> should be a float number between 0~1.

* **interval**: 
    a number indicate the interval between looped effect.
   
    \<number> 0 stands for no loop, other numbers count in milliseconds.

* **order**: 
    the order of sending effect to the website (only work with type taketurn).
    
    \<?> could be `1` (in order), `-1` (reverse order), `"middle"` (start from middle) or `order array`.

### light

* **mode**:
    
    \<string> could be `none`, `light`, `blink`, `follow` (means following sound to light).

* **alpha**:
    the transparency of light color.

    \<float> should be a float number between 0~1.

* **color**:
    the rgb color of light.

    \<string> ex: "255,255,255"

* **loopTime**: 
    how many times the lighting effect repeats.
    
    \<number> in milliseconds

* **duration**:
    
    when in blink mode --> the duration(ms) of blink.

    when in light mode --> the speed of color transition. (try 20 and 70)

    \<number> 

* **endDelay**:
    the duration between repeated effect.
    
    \<number> in milliseconds

* **random**:
    the random range for different website to start lighting.

    \<number> in milliseconds


### sound

* **order**:
    sound order

* **orderTo**:
    random play sound between order and orderTo(not included).

* **stop**:
    
    \<string> `"stop"` to stop sound


* **volume**:

    \<number> in decibel


## Max Patch Usage

For a new start, use `control_template.maxpat`, or you could try `control.maxpat` which contains pre-designed pattern.

### effect pattern in control.maxpat

* 1: random light with white/colorful color and sound.

* 2: random light while gradually speeding up.

* 3, 5: follow effect

* 4: a taketurn effect


