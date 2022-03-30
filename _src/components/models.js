// 1. Model section 	: functions describing the dydt models
// 2. Evap section 	: functions describing evap forcing eqs
// 3. Params section  : vars holding the default paravalues
// ---------------------------------
// 1. Model section
// ---------------------------------
function model190(Y,tUnix,f){
	// Model 190 is the constant runoff scenario
	// This model uses linear reservoirs to describe
	// the hillslope and channel
	// Expectation is Y is an array of three values
	// Y[0] : Channel discharge				[m^3 s^-1]
	// Y[1] : sp, water ponded on hillslope 	[m]
	// Y[2] : ss, eff. depth of subsurf. 		[m]
	// forcings, f = [evap_pond, evap_sub, p(t)]
	// t : time, in unix time. As int.
	// Returns an array of:
	// dydt[0] : dq/dt
	// dydt[1] : dsp/dt
	// dydt[2] : dss/dt

	var dydt = [0.0, 0.0, 0.0];
	var inflow = this.yFromParents(tUnix); // get inflow from parent nodes at time t
	var qpc = this.k2 * Y[1]; // flow from pond to channel
	var qsc = this.k3 * Y[2]; // flow from sub to channel	
	dydt[1] = f[2] * this.c1 - qpc - f[0]; // dydt[1] = dsp/dt = p(t) * c1 - k2 * sp - evap_pond
	dydt[2] = f[2] * this.c2 - qsc - f[0]; // dydt[2] = dss/dt = p(t) * c2 - k3 * ss - evap_sub
	dydt[0] = (qpc + qsc) * (this.A_h / 60) + inflow - Y[0];
	// dydt[0] = Math.pow(Y[0]/GBL.params.q_r,GBL.params.lambda_1) * this.invtau * dydt[0];
	dydt[0] = Math.pow(Y[0],GBL.params.lambda_1) * this.invtau * dydt[0];
	return dydt;
};

function model252(Y,tUnix,f){
	// Top Layer Hydrological Model
	// This model describes the hydrological model *without linear reservoirs*.
	// It features a layer of topsoil to create a runoff coefficient varies in time.
	// The setup to this model is similar to that of 190 (constant runoff)
	
	// Expectation is Y is an array of 7 values
	// Y[0] : Channel discharge				[m^3 s^-1]
	// Y[1] : sp, water ponded on hillslope 	[m]
	// Y[2] : st, eff. depth in topsoil 		[m]
	// Y[3] : ss, eff. depth of subsurf. 		[m]
	// Y[4] : s_precip, total fallen precip 	[m] 
	// Y[5] : V_r, total flux of water
	// 	   from runoff from time 0 to t 	[m^3 s^-1]
	// Y[6] : Channel discharge from baseflow  [m^3 s^-1]
	
	// Forcings
	// f[0] : evap_pond,
	// f[1] : evap_top,
	// f[2] : evap_sub,
	// f[3] : p(t)

	// t : time, in seconds. As int.
	// Returns an array of:
	// dydt[0] : dq/dt
	// dydt[1] : dsp/dt
	// dydt[2] : dst/dt
	// dydt[3] : dss/dt
	// dydt[4] : ds_precip/dt
	// dydt[5] : dV_r/dt
	// dydt[6] : dqb/dt
	
	var qpc, qpt, qts, qsc;
	
	// use below to calc qpt
	function kt(k2,st){return k2 * (GBL.params.A + GBL.params.B * Math.pow((1 - st/GBL.params.S_L),GBL.params.exponent));};

	var dydt = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
	qpc = dydt[5] = this.k2 * Y[1];
	qpt = kt(this.k2,Y[2]) * Y[1];
	qts = this.ki * Y[2];
	qsc = GBL.params.k_3 * Y[3];

	dydt[0] = this.c2 * (qpc + qsc) - Y[0];
	dydt[0] += this.yFromParents(tUnix,0) // add q inflow from parents
	dydt[0] = this.invtau * Math.pow(Y[0],GBL.params.lambda_1) * dydt[0];
	
	dydt[4] = this.c1 * f[3];
	dydt[1] = dydt[4] - qpc - qpt - f[0];

	dydt[2] = qpt - qts - f[1];
	dydt[3] = qts - qsc - f[2];
	dydt[6] = (GBL.params.v_B / this.L) * 
				(this.A_h * qsc + this.yFromParents(tUnix,6) - 60 * Y[6]);

	return dydt
};


// ---------------------------------
// 2. Evap section
// ---------------------------------
function getEvap190(t = this.linkTime){
	// return the calculated monthly evaporation
	// from ponded and subsurface water
	// evapPond and evapSub

	// Warning: this.sp and this.ss refer to the
	// 		 their values at this.linkTime, 
	// 		 regardles of whether a different time
	// 		 is specified. Change.
	

	var evap = [0.0, 0.0, undefined]; // added undefined for precip placement

	// Convert to [mm / min]
	// FLAG: t is in seconds, begin in ms.
	// FLAG: getting month this way is very costly
	var month = new Date(begin.getTime() + t*1000).getMonth();
	var e_pot = evap_monthly[month] * GBL.params.u; 

	var C_p = 0.0;
	var C_s = 0.0;
	var C_T = 0.0;
	var Corr_evap = 0.0;

	if (e_pot > 0.0) {
		C_p = this.state[1] / e_pot;
		C_s = this.state[2] / e_pot;
		C_T = C_p + C_s;
	}

	if (C_T > 1.0) {
		Corr_evap = 1.0 / C_T;
	} else {
		Corr_evap = 1.0;
	}

	evap[0] = Corr_evap * C_p * e_pot; // evapPond
	evap[1] = Corr_evap * C_s * e_pot; // evapSub

	return evap;
};

function getEvap252(t = this.linkTime){
	// return the calculated monthly evaporation
	// from ponded and subsurface water
	// evapPond and evapSub

	// Warning: this.sp and this.ss refer to the
	// 		 their values at this.linkTime, 
	// 		 regardles of whether a different time
	// 		 is specified. Change.

	// var state = this.state;

	var a, b, c, corr;
	var evap = [0,0,0,undefined];

	a = this.state[0]/GBL.params.s_r;
	b = this.state[2]/GBL.params.S_L;
	c = this.state[3]/(GBL.params.h_b - GBL.params.S_L);
	corr = a + b + c;

	var month = new Date(begin.getTime() + t*1000).getMonth();
	var e_pot = evap_monthly[month] * GBL.params.u / corr; 
	evap[0] = a * e_pot;
	// evap[0] = a * e_pot * 1e3; // This is tricky and arbitrary. Talk to Felipe about it.
	evap[1] = b * e_pot;
	evap[2] = c * e_pot;

	return evap;
};

// ---------------------------------
// 3. Parameter Section
// ---------------------------------
// Model 190
var paramsConstantRunoff = {
	"u"			: Math.pow(10,-3)/(30*24*60), // unit conversion.
	"v_r"		: 0.33,
	"lambda_1"	: 0.20,
	"lambda_2"	: -0.1,
	"RC"		: 0.33,
	"v_h"		: 0.1,
	"v_g"		: 2.2917e-5,
	"q_r"		: 1.0, // unit consistency
	"A_r"		: 1.0  // unit consistency
};

// // Model 252
var paramsVariableRunoff = {
	"v_r"		: 0.33,   // v_r = v_0
	"lambda_1"	: 0.20,   // Same  
	"lambda_2"	: -0.1,   // Same
	"v_h"  		: 0.02,  
	"k_3"       : 2.0425e-6, 
	"beta"		: 0.02,       
	"h_b" 		: 0.5, 
	"S_L"  		: 0.10, 
	"A"   		: 0.0, 
	"B"    		: 99.0, 
	"exponent" 	: 3.0,     
	"v_B"		: 0.75,
	"q_r"		: 1.0, // unit consistency
	"A_r"		: 1.0, // unit consistency
	"s_r"		: 1.0, // unit consistency
	"u"			: Math.pow(10,-3)/(30*24*60), // unit conversion.
};