var GBL = {
	"model"	: 252,

	"begin"	: "2017-01-01 00:00",
	"end"	: "2017-01-05 00:00",

	"keep"	: [2527],

	"solver"	: {
		"method"	: "RK4",

		// Undefined if you want the solver to calculate its own
		// initial first step for each link. Otherwise, supply a
		// initial step size in seconds.
		"firstStep" : undefined, // [sec] 
		// "firstStep" : 15
		// the rest of the solver deets
		// are in the separate variables below.

		"abs"		: [1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 1e-6],
		"rel"		: [1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 1e-6],	
	},



	// Initial values and lower limits for
	"vals"		: [1.000000e-6,0.000000e+00,0.000000e+00],
	"limits"	: [1.000000e-6,0.000000e+00,0.000000e+00],

	// List the simulation file names [and paths]
	"simulationFiles" : [
		"prm-clear.js", // prm*.js holds parameters for each hillslope link
		"rvr-clear.js", // rvr*.js holds network topology and the order by which to solve the links
		"str-clear.js", // str*.js holds the rainfall input
		"evap_monthly.js" // evap_monthly.js holds average evap 
	]
};

// Add each of the simulation files to the head of the html document
for (i in GBL.simulationFiles){addScriptToHead(GBL.simulationFiles[i])};

// var precip = {};