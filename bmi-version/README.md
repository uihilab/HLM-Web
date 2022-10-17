# HLM-Web, BMI
Welcome to the BMI-compliant version of HLM-Web.
Here you will find the refactored source code and test cases that use the codebase.

For those unfamiliar with the Basic Model Interface (BMI) specification, we encourage you to acquiant yourself with the project via its [documentation](https://bmi-spec.readthedocs.io/en/latest/index.html).

## Table of Contents
- [Getting Started](https://github.com/uihilab/HLM-Web/tree/master/bmi-version#getting-started)
- [Loading the codebase](https://github.com/uihilab/HLM-Web/tree/master/bmi-version#loading-the-codebase)
- [Usage](https://github.com/uihilab/HLM-Web/tree/master/bmi-version#usage)
- [Configuration Files](https://github.com/uihilab/HLM-Web/tree/master/bmi-version#Configuration-Files)
- [Simulation Files](https://github.com/uihilab/HLM-Web/tree/master/bmi-version#Simulation-Files)

## Getting Started
To get started, download the repo and run one of the Test Cases, `Test` or `Clear Creek`.
Each test case comes with an `index.html` file and the model's requisite input data as JSON.
(This differs from the standard version, where input data was supplied as pre-defined variables in `.js` scripts.)

## Loading the codebase
Each `index.html` file imports one javasript file.

```html
<script src="../../_src/shell.js"></script>
```

In the `shell.js` file, the BMI and HLM codebases are loaded into the browser.
```javascript
/** Chained import of first BMI package then HLM */
import('./bmi.js').then(
    (BMI) => {
        window.BMI = BMI.default;
    }
    ).then( () => {
        import('./hlmweb-bmi.js').then(
            (HLM) => {
                window.HLM = HLM.default;
                window.searchInsert = HLM.searchInsert;
            }
        )
    });
```

## Usage
See here for quickstart usage of the HLM-Web-bmi.


### Making a HLM model instance
To instantiate a new model of the HLM class:

```javascript
var model = new HLM('<config file path here>.json');
```

Note, it is possible to make a new HLM variable without passing a configuration file path.
Doing so would return an empty object.
To prepare an empty HLM type object for use, you would then perform:

```javascript
model.initialize('<config file path here>.json');
```

**Note:** See [Configuration Files](https://github.com/uihilab/HLM-Web/tree/master/bmi-version#Configuration-Files) for details on the contents of the config files.

### Advancing Model Foward in Time
Models are advanced in time using either of the following methods:
```JavaScript
// update one default time step
model.update();

// update a specifiied amount of time (in seconds)
model.update(<time>);
```

When using `update()`, no time goal is supplied and the model should step its default timestep.
We allow the user to define set the default time step via the `defaultStep` property in the configuration file.
(See [Configuration Files](https://github.com/uihilab/HLM-Web/tree/master/bmi-version#Configuration-Files) below.)
For testing, we have used 3600 seconds (i.e., 1 hour,) as our default time step.

**Note:** Internally, the adaptive stepsize numerical solver often takes many smaller steps than the default interval provided to ensure a solution that conforms to the error thresholds provided it in the configuration file in the `solver.err` property.
Thus, the `defualtStep` interval is only used to pause the advancement of the simulation.

### Getting and Setting Variables of HLM-Web
HLM-Web (BMI,) allows users to get and set the values of all variables within the model.

To set a variable value at every link, or specified subset of links:
```JavaScript
// give all hillslope-links in model new values
model.set_value(<variable name>,<new values for all links>);

// give a subset of hillslope-links in model a new value
model.set_value_at_indices(<variable name>,<linkIDs>,<values>);
```

To get a variable value at every link, or a specified subset of links:
```JavaScript
// give all hillslope-links in model new values
model.get_value(<variable name>,<destination for values>);

// give a subset of hillslope-links in model a new value
model.get_value_at_indices(<variable name>,<linkIDs>,<destination for values>);
```

Internally, each model (e.g., the Constant Runoff Model,) has a set of input variables and output variables.
The getter and setter methods work with both the input and output variables.
Input variables are mostly fluxes, while output variables are the model states.
For each model, variables can be found within the method `handleModelConfig` of the `HLM` class.
For example:

```JavaScript
// Standard Names
this._inNames = [
   "atmosphere_water__rainfall_volume_flux",
   "land_surface_water__potential_evaporation_volume_flux"
];

this._outNames = [
   "channel_water_x-section__volume_flow_rate",
   "land_surface_water__depth",
   "land_subsurface_water__effective_depth"
];
	
//
this._inNamesSimple = ["precip", "evap"];
```

## Configuration Files
The structures and information of the BMI-compliant configuration file and the standard configuration file are practically the same, with some minor changes.
An example config file (`gbl-test.json`) is provide below:

```javascript
{
	"model": 190,
	"modelName":"HLM - Constant Runoff Model",
	"begin": "2017-01-01 00:00",
	"end": "2017-01-02 00:00",
	"keep": [10,9,3,7,4,6,2,8,1,5,80],
	"defaultStep": 3600,
	"outputInterval" : 300,
	"solver": {
		"method": "RK4",
		"firstStep": "null",
		"limits"	: [1.000000e-6,0.000000e+00,0.000000e+00],
		"err" : {
			"abs": [1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 1e-6],
			"rel": [1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 1e-6]}
	},
	"ICs": {"vals": [1.000000e-6,0.000000e+00,0.000000e+00]},
	"simulationFiles": {
		"prm":"prm-test.json",
		"rvr":"rvr-test.json",
		"str":"str-test.json",
		"ics":"ics-test.json"
	},
	"globalParams" : {
		"note"		: "not all of these are necessary for all models",
		"A"   		: 0.0, 
		"A_r"		: 1.0,
		"B"    		: 99.0, 
		"beta"		: 0.02,
		"exponent" 	: 3.0,   
		"h_b" 		: 0.5, 
		"k_3"       : 2.0425e-6, 
		"lambda_1"	: 0.20,
		"lambda_2"	: -0.1,
		"q_r"		: 1.0,
		"RC"		: 0.33,
		"S_L"  		: 0.10,
		"s_r"		: 1.0,
		"u"		: 2.3148148148148148e-8,
		"v_B"		: 0.75,
		"v_g"		: 2.2917e-5,
		"v_h"		: 0.1,
		"v_r"		: 0.33
	},
	"reporting" : {
		
	}
}
```

In the BMI version, `defaultStep` and `outputInterval` have been added as parameters to the global input object.
These are supplied in the units of **seconds**.

**`outputInterval`**: This parameter within the global file dictates the time interval the model will supply its results. 
This interval should be less than `defaultStep`.
Further, **`defaultStep` should be evenly divisible by `outputInterval`**.

## Simulation Files
Changes have also been made to the manner in which input/simulation data is provided and ingested.

```javascript
"simulationFiles": {
		"prm":"prm-test.json",
		"rvr":"rvr-test.json",
		"str":"str-test.json",
		"ics":"ics-test.json"
	}
```

Note, that these are `.json` files, while previously data has been provided in `.js` files.

#### Parameter File
The naming convention adopted here is `prm-<identifier>.json`.

Internally the structure is as follows:
```javascript
{
	"dtype":"prm",
	"data" : [
		[8, 0.00071124,0.03092143,0.00071124],
		[6, 0.03485141,0.33115613,0.03485141],
		[7, 0.05761012,0.33115613,0.05761012],
	]
}
```

A `dtype` parameter describes the data that the file contains.
The value of the `data` key is an array of arrays.
Each array contains four items: a unique hillslope ID, total upstream area (km^2), length of the hillslope channel (km), and area of the hillslope (km).

#### River Topology File
The naming convention adopted here is `rvr-<identifier>.json`.

Internally the structure is as follows:
```javascript
{	
	"dtype":"rvr",
	"data" : {
		"topology":{
			"6"	: [],
			"7"	: [],
			"8"	: [6,7],
		},
		"order" : [7,6,8] 
	}
}
```

A `dtype` parameter describes the data that the file contains.
The value of the `data` key is an object which contains two objects with it: `topology`and `order`.

`topology` describes the network topology. 
All networks are directed trees.
The key-value pairings in the `topology` object are the

```javascript
<link id> : [<upstream link id>,...]
```

The array of upstream links can be empty, meaning that the link is a leaf on the directed tree.
For example, the simple topogoly provide above describes a network where water from channels 6 and 7 drain to the channel of link 8.

#### Forcing File
The naming convention adopted here is `str-<identifier>.json`.
Though using the standard `str` prefix for *storms*, this file is now organized to accept any flux/forcing data that are used with HLM.
For now, that is evaporation and precipitation.

```javascript
{
	"dtype" : "forces",
	"ftype" : ["evap","precip"],
	"isUniform"  : {
		"evap" : true,
		"precip" : true
	},
	
	"units" :{
		"precip" : {
			"t" : "seconds",
			"v" : "mm hr-1"
		},
		"evap" : {
			"v" : "mm month-1"
		}
	},

	"data" : {
		"links" : {
			"0" : {
				"evap" : [19.0,18.0,30.0,32.0,48.0,77.0,121.0,112.0,52.0,20.0,15.0,13.0],
				"precip" : {
					"t"	: [0.00000000, 6000.00000000, 12000.00000000],
					"v" : [40.00000000, 20.00000000, 0.00000000]
				}
			}
		}
	}
}
```

- `dtype` describes the data that the file contains.
- `ftype` is an array with the keys of each of the forcings to include in the model.
- `isUniform` is an object whose keys are the values contained in `ftype`. The value is a boolean, used to process the input data. If `isUniform` is `true`, then that means every hillslope link will take the same input forcing value. If `isUniform` is `false`, then the program will first look for forcing information within a key that matches the linkID. If no key is found to match the linkID, then the hillslope link will receive the default value contained within the key "0".
- `units` describe the units for each variable associated with the forcings. Best practice is to use the CSDMS standard naming conventions for units.
- `data` contains the forcing data for each link.

#### Initial Conditions File
The naming convention adopted here is `ics-<identifier>.json`.
The format for initial conditions is very similar to that of the forcing file, above.

```javascript
{
    "dtype" : "ICs",
    "data" : {
        "modelNumber" : 190,
        "nLinks" : 1,
        "links" : {
            "0" : [1.000000e-6,0.000000e+00,0.000000e+00]
        }
    }
}
```

When building a particular link, the program will look to see whether there are initial conditions within the `links` object under the link id key. If none, then the hillslope link will take the default initial conditions stored in `links[0]`.

