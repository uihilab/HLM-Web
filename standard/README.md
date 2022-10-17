# HLM-Web

<p align="center">
    <img width="350" src = https://github.com/uihilab/HLM-Web/blob/main/images/WebHLM-color.png>
</p>

## Table of Contents
* [Introduction](https://github.com/uihilab/HLM-Web#Introduction)
* [About HLM](https://github.com/uihilab/HLM-Web#About-HLM)
* [Getting Started](https://github.com/uihilab/HLM-Web#Getting-Started)
* [Data Inputs](https://github.com/uihilab/HLM-Web#Data-Inputs)
	* [Global Input File](https://github.com/uihilab/HLM-Web#Global-Input-File)
	* [Network Connectivity File](https://github.com/uihilab/HLM-Web#Network-Connectivity-File)
	* [Parameter File](https://github.com/uihilab/HLM-Web#Parameter-File)
	* [Precipitation Forcing File](https://github.com/uihilab/HLM-Web#Precipitation-Forcing-File)
	* [Evaporation Forcing File](https://github.com/uihilab/HLM-Web#Evaporation-Forcing-File)
* [Numerical Solver](https://github.com/uihilab/HLM-Web#Numerical-Solver)
* [Acknowledgements](https://github.com/uihilab/HLM-Web#Acknowledgements)
* [References](https://github.com/uihilab/HLM-Web#References)

<!-- * [Test Examples](https://github.com/uihilab/HLM-Web#Test-Examples) -->
<!-- * [Community](https://github.com/uihilab/HLM-Web#Community) -->
<!-- * [Feedback](https://github.com/uihilab/HLM-Web#Feedback) -->
<!-- * [Scalability and To Do's](https://github.com/uihilab/HLM-Web#Scalability-and-To-Dos) -->
<!-- * [License](https://github.com/uihilab/HLM-Web#License) -->

## Introduction
HLM-Web is a physically-based, rainfall-runoff modelling engine capable of providing operational level results using client-side compute while running in a browser.
"HLM" stands for the Hillslope Link Model, which is a family of mathematical models that describe rainfall-runoff and streamflow generation processes. 
"Web" indicates that the package runs natively using modern web standards (i.e., JavaScript.)

## About HLM
HLM is a family of mathematical models that describe the physical processes of rainfall-runoff response and streamflow generation from a river network.
Importantly, the directed tree structure of the river network aides in the computation of the numerical solution.
HLM and a numerical solver have been implemented in other languages, namely in the [C Programming Language](https://asynch.readthedocs.io/en/latest/index.html) for the Iowa Flood Center's flood forecasting tool.
Currently implemented, HLW-Web is packaged with both constant and variable rainfall-runoff models.
[Many more models exist](https://asynch.readthedocs.io/en/latest/builtin_models.html) in the C Programming Language implementation.
Thus, **additional models can easily be added upon need and request**.

## Getting Started
To get started, download the repo and run one of the [Test Cases](https://github.com/uihilab/HLM-Web/tree/main/test-cases), `Test` or `Clear Creek`.
To do so, navigate to their folder and run the `.html` file.
Respectively, they are:
- `test-constant-runoff-test.html`, and
- `clear-creek-variable-runoff-test.html`

Both files provide an interactive interface to run the simulation and visualize the results.
Likewise, inspecting the html code for each provides examples of how to include both the simulation source code and the input data required to run a simulation.

For source code:
```html
<script src="_src/hlm-web.js"></script>
```

For input data:
```html
<script src="gbl.js"></script>
```

Once all the requisite files are loaded and data input, a simulation is triggered by calling `runDynamicSimulation()` function.
For the test cases provided, this function can be called via a click of a button.
Likewise, once the test case simulations are finished results will automatically be plotted in a figure.
Below are the expected outputs from the test cases.
<p align="center">
    <img src = https://github.com/uihilab/HLM-Web/blob/main/images/Benchmarking-Combined.svg>
</p>

## Data Inputs
Numerous inputs are required to construct and solve the model equations.
This includes network connectivity, hillslope link parameters, numerical error tolerances, precipitation forcings, a mathematical model for the hydrological processes, etc. 
Currently, five input files are used to load the requisite input data into the browser:

- `gbl.js`, the global inputs file
- `rvr-*.js`, network connectivity file
- `prm-*.js`, hillslope link parameters input file
- `str-*.js`, precipation forcing file
- `evap_monthly.js`, evaporation forcing file

**Note:** the separation of input data between files is helpful for organization, however not necessary for successful simulation preparation.
Rather, what is more important is that all of the variables that the simulation engine expects are defined prior to starting a simulation.

The following subsections will briefly cover each of these inputfiles and the variables that they hold.

### Global Input File
The global input file contains the variable `GBL`.
Notably, it also includes the filepaths to the other files needed to complete the simulation.
Within the global input file, there is a function call to include these other simulation files to the head of the html file.
(See below for more detail on the other simulation data files.
An example `GBL` file is below.

```Javascript
var GBL = {
	"model"	: 190, // each hydro model has its own number.

    // datetime strings for beginning and end of simulation time
	"begin"	: "2017-01-01 00:00",
	"end"	: "2017-01-02 00:00",

    // an array of link ids you want results for post simulation
	"keep"	: [80], 

	"solver"	: {
		"method"	: "RK4", // for now, always RK4
		"firstStep" : undefined, // [sec], if undefined automatically calculated
        
        // absolute and relative error tolerances for solver
		"abs"		: [1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 1e-6],
		"rel"		: [1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 1e-6],	
	},
    
    // initial conditions at all links
	"vals"		: [1.000000e-6,0.000000e+00,0.000000e+00],
    
    // lower limits for each state variable
	"limits"	: [1.000000e-6,0.000000e+00,0.000000e+00],
    
    // List the simulation file names [and paths]
	"simulationFiles" : [
		"prm-test.js", // prm*.js holds parameters for each hillslope link
		"rvr-test.js", // rvr*.js holds network topology and the order by which to solve the links
		"str-test.js", // str*.js holds the rainfall input
		"evap_monthly.js" // evap_monthly.js holds average evap 
	]
};

// Add each of the simulation files to the head of the html document
for (i in GBL.simulationFiles){addScriptToHead(GBL.simulationFiles[i])};
```
**`model`**: each mathematical model describing a particular hydrological process has a model number.
[See here for more information on model numbers](https://asynch.readthedocs.io/en/latest/builtin_models.html).

**`vals`** and **`limits`**: the length of these arrays change depending on the number of state variables within the model.

### Network Connectivity File
By convention, the network/river connectivity/topology file name takes the form of `rvr-*.js`.
The network connectivity file holds the `topology` and `linksToStep` variables.

#### Variable: `topology` 
`topology` is an object, where keys are link ids and values are arrays of the _parent_ link ids.
An example definition of `topology` is below.

```Javascript
var topology = {
// Link Id : [Array of Parents]
1	: [2, 8, 3],
9	: [],
2	: [6, 4],
3	: [9, 10],
4	: [7],
5	: [],
6	: [],
80	: [5,1],
7	: [],
8	: [],
10	: []
};
```

The above input data describes the network topology shown below.

<p align="center">
    <img style='max-height:330px;' src=https://github.com/uihilab/HLM-Web/blob/main/images/test-topo.jpg>
</p>

#### Variable: `linksToStep`
In lieu of a routine in HLM-Web to schedule the solution of the hillslope links, a modeller supplies the order in which to solve the links (... for now.)
The variable `linksToStep` is where the order is supplied.
`linksToStep` is an array of link ids where the link id in `linkToStep[i]` will be solved prior to `linkToStep[i+1]`.
Because the network is a directed tree, one memory efficient order to solve the links is a Depth First Search Post-Order.
In each example provided in the test cases, the link ids in `linksToStep` are in a DFS Post-Order.

An example definition of `linksToStep` is below.
```Javascript
var linksToStep = [7,4,6,2,10,9,3,8,1,5,80];
```

### Parameter File
By convention, the parameter file name takes the form of `prm-*.js`.
The parameter file holds the variable `prm`, which is an array of arrays.
Each subarray defines the parameters of a hillslope link.
The structure for the subarray is as follows:

```
[Link ID, Total Area (A), Link Length (L), Link of hillslope (A_h)]
```

An example of the `prm` is as follows:
```Javascript
var prm = [
    [8, 0.00071124,0.03092143,0.00071124],
    [6, 0.03485141,0.33115613,0.03485141],
    [7, 0.05761012,0.33115613,0.05761012],
    [9, 0.08961630,0.43183613,0.08961630],
    [10, 0.09032604,0.43183613,0.09032604],
    [4, 0.09530519,0.33115613,0.03769507],
    [2, 0.13726909,0.33115613,0.00711249],
    [5, 0.18206716,0.84828067,0.18206716],
    [3, 0.24181816,0.43183613,0.06187582],
    [1, 0.42674164,0.26215310,0.04694315],
    [80, 0.63299135,0.10799837,0.02418255],
];
```

### Precipitation Forcing File
By convention, the precipitation forcing file names take the form of `str-*.js`.
Within the file is the variable `stormTS`, an object.
The object keys are link ids, and their associated values are themselve objects, 
which themselves hold an object which holds arrays keyed to `t` and `p`; time and precipitation.
Time is given in minutes from the beginning of simulation time.
Precipitation is given as _mm/hour_.

An example of this convolluded structure is below.

```Javascript
var stormTS = {
    1 : {
        "ts" : {
	    // Timeseries precip as function of time, p(t)
	    "t"	: [0.00000000, 100.00000000, 200.00000000],
	    "p" : [40.00000000, 20.00000000, 0.00000000]
	}
    }
};
```

### Evaporation Forcing File 
Evaporation that occurs at each hillslope link over each time step is calculated given a number of considerations.
One such consideration is the _potential_ evaporation that could occur during the month the simulation time is in.
This _potential_ monthly evaporation is defined in the file `evap_monthly.js`, which itself contains the variable `evap_monthly`.
The values provided in this file are indicative of the Iowa climate and are in the units _mm/month_.
Refer to the test case documentation for how each model uses these values in calculating evaporitive losses from the hillslope.
The default values used for Iowa are provided below.

```Javascript
var evap_monthly = [19.0, 18.0, 30.0, 32.0, 48.0, 77.0, 121.0, 112.0, 52.0, 20.0, 15.0, 13.0];
```

## Numerical Solver
The current implementation uses an asynchronous RK4 integrator, with a dense method interpolation scheme for between-step approximations.
This solver was tailored specifically to solve large systems of ordinary differential equations with a directed tree structure.
Though this solver was tailored to hydrological problems, any problem with this structure could be solved using this solver.

## Acknowledgements
This project is developed by the [University of Iowa Hydroinformatics Lab (UIHI Lab)](https://hydroinformatics.uiowa.edu/).

## References
(in manuscript) Gregory Ewing, Ricardo Mantilla, Witold Krajewski, & Ibrahim Demir. Interactive Hydrological Modelling and Simulation on Client-Side Web Systems: An Educational Case Study.
