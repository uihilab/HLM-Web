function setSolverLimsAndInitialConditions(modelNumber){
	switch (GBL.model){
		case 190: 
			GBL.vals = [1.000000e-6,0.000000e+00,0.000000e+00];
			GBL.limits = [1.000000e-6,0.000000e+00,0.000000e+00];
			return paramsConstantRunoff;
		case 252:
			GBL.vals = [1.000000e-6,0.000000e+00,0.000000e+00,0.000000e+00,0.000000e+00,0.000000e+00,1.000000e-6];
			GBL.limits = [1.000000e-6,0.000000e+00,0.000000e+00,0.000000e+00,0.000000e+00,0.000000e+00,0.000000e+00];
			return paramsVariableRunoff;
	};
}

function makeDynamicLinks(){
	var x,l;
	var links = {};
	
	for (x in prm){
		l = new dynamicLink(prm[x]);
		links[l.id] = l;
	}
	return links;
}

class dynamicLink{
	constructor (paramArray){
		// Instantiate Dynamic Stepping Link Object
		// Process:
		// 1. Add common attributes
		// 2. Add dydt model and supporting funcs
		// 3. Add Solver/Stepp and supporting funcs
		// ---------------------------------------
		// 1. Add common attributes
		// ---------------------------------------
		// unique identifier
		this.id = paramArray[0];

		// ---- Time components, conversions ----
		this.linkTime = 0;
		this.timeStack = [this.linkTime];
		this.hstep = GBL.solver.firstStep
		this.sec2min = 60; // 60 sec / 1 min
		this.min2sec = 1/60; // 1 min / 60 sec
		this.sec2hr = 3600;

		// ---- physical parameters, topo ----
		this.A  = paramArray[1]; // total area upsteam, still in km^2
		this.L = paramArray[2] * 1000; // km -> m
		this.A_h = paramArray[3] * 1e6; // km^2 -> m^2
		this.parents = topology[this.id]; // returns type array of link ids
		this.invtau = (60 * GBL.params.v_r * Math.pow((this.A / GBL.params.A_r), GBL.params.lambda_2));
		this.invtau = this.invtau / ((1-GBL.params.lambda_1) * this.L );
		this.k2 = GBL.params.v_h * this.L / this.A_h * 60; // [1 / min]

		// ---- precip forcing -----
		// this could be built out to include other utilities
		this.formatPrecip();

		// These are other available options for specific use cases.
		// Contact Greg for the supporting code for these precip methods
		// this.precip = processPrecip();
		// this.precip = makeAtlas14Hyetograph(intensity,duration,quartile);

		// ---------------------------------------
		// 2. Add dydt model and supporting funcs
		// ---------------------------------------
		this.initModel();

		// ---------------------------------------
		// 3. Add Solver/Stepp and supporting funcs
		// ---------------------------------------
		this.initSolver();
	}

	initModel(){
		switch(GBL.model){
			case 190:
				// states
				this.state = GBL.vals.slice(); // this.state.length = 3; // [ q ,  sp,  ss ]
				// mem
				this.mem = {0: [ [ this.state[0] ] ]};
				this.keepStates = [0]; //[q_channel]

				// model/link-specific vals
				this.k3 = GBL.params.v_g * this.L / this.A_h * 60; // [1 / min]
				this.c1 = GBL.params.RC * (0.001/60);
				this.c2 = (1 - GBL.params.RC) * (0.001/60);

				// set funcs
				this.dydt = model190;
				this.getEvap = getEvap190;
				break;
			case 252:
				// Set State
				// initArray should be of length 4
				// initial vals for [ q, sp, st, sp]
				// final vals: [q, sp, st, ss, s_precip, V_r, qb]
				this.state 		= GBL.vals.slice();
				// this.state 		= init.vals; this.state.length = 7; 
				// this.state[4] 	= 0.0;
				// this.state[5]	= 0.0;
				// this.state[6]	= init.vals[0];

				// set mem
				this.mem = {0: [ [ this.state[0] ] ], 6: [ [ this.state[6] ] ]};
				this.keepStates = [0,6]; //[q_channel, q_baseflow]
				
				// model/link-specific vals
				this.ki = this.k2 * GBL.params.beta; 	// [1 / min]
				this.c1 = 0.001/60;					 	// []
				this.c2 = this.A_h / 60;
				this.q_r = 1;this.A_r = 1;this.s_r = 1;	// [m^3 s^-1], [L^2], [L]

				// set funcs
				this.dydt = model252;
				this.getEvap = getEvap252;
				break;
		};
	}

	initSolver(){
		switch(GBL.solver.method){
			case "DOPRI":
				this.solver 	= DOPRIsolver;
				this.DOPRI45	= fDOPRI45;
				this.calcBetas	= calcBetasDOPRI;
				break;
			case "RK4":
				this.solver 	= RK4solver;
				this.RK4		= fRK4;
				this.calcBetas	= calcBetasRK4;
				break;
			default :  // Default RK4
				this.solver 	= RK4solver;
				this.RK4		= RK4;
				this.calcBetas	= calcBetasRK4;
		}	
	}

	formatPrecip() {
		//Ingest the hyetograph from storm file
		//Format times data so that they are consistent
		//with the model date time obj.
		
		var i;
		this.precip = stormTS[this.id].ts;
		
		// t is in minutes from beginning simulation
		// convert to seconds from beginning of sim
		for (i in this.precip.t){
			this.precip.t[i] = this.precip.t[i] * this.sec2min;
		}
	}

	getY(tUnix,memKey){ 
		// Given tUnix, return q for link
		// Use dense method

		// 1. search insert returns index location of 
		// insert location for the desired time val.
		// 2. Dense method to estimate q at tUnix
		var after = searchInsert(this.timeStack,tUnix);

		if (this.timeStack[after] === tUnix){
			return this.mem[memKey][after][0];
		} else {
			var before = after - 1;
			var afterTime = this.timeStack[after];
			var beforeTime = this.timeStack[before];
			var qks = this.mem[memKey][before];

			// ---- DENSE METHOD ----
			// y(t + 0.) = y_0(t) + h * sum(b_i(theta) * k_i)

			var theta = (tUnix - beforeTime) / (afterTime - beforeTime);
			var betas = this.calcBetas(theta); // call beta function

			var u = 0;
			var i = 0;
			for (i = betas.length - 1; i >= 0; i--) {
				u = u + betas[i] * qks[i+1];
			}
			u = u * (afterTime-beforeTime) * this.min2sec; //this.sec2min;
			u = qks[0] + u;

			// ---- END DENSE METHOD ----
			return u;
		}
	}

	getPrecip(tUnix) {
		// given unix time,
		// return array of the following:
		// [ pVal : precip forcing val at linkTime
		//   tEnd : unix time of end of continuous p forcing ]
		
		var resultsArray = [0.0, 0.0];
		var index = this.precip.t.indexOf(tUnix);

		if (index === -1) { // Returns -1 if not in array
			// Find insert position
			index = searchInsert(this.precip.t,tUnix);
			resultsArray[0] = this.precip.p[Math.max(0,index-1)];
			resultsArray[1] = this.precip.t[index];
		} else { // Exact time in array
			resultsArray[0] = this.precip.p[index];
			resultsArray[1] = this.precip.t[index + 1];
		}

		// If t beyond end of array, resultsArray[1] is NaN.
		// Adjust tEnd to equal end.getTime();
		if (isNaN(resultsArray[1])){
			resultsArray[1] = end;
		}

		return resultsArray;
	}

	yFromParents(tUnix,memKey=0){
		// Returns a single numeric value
		// at time t at the Link Object this.
		// Iterate over all of the link's parents to sum
		// their flow at time t provided.
		// used 'y' as a generic dependent var

		// specify memKey to tell which var to search over


		var y = 0;
		var i;

		for (var i = this.parents.length - 1; i >= 0; i--) {
			y += links[this.parents[i]].getY(tUnix,memKey);
		}
		return y;
	}

	step(tGoal=this.linkTime + this.hstep) {
		// Use integrator with multiple timesteps to
		// determine error and then update appropriate 
		// step size.
		// this.hstep is the largest possible step the solver
		// will take. 
		// IF the forcings at this.linkTime and += this.hstep
		// are the same, there will not be any discontinuities
		// from the stepwise forcing functions in the integration
		// approximation, even if hstep is changed because of
		// error limits (hstep will get smaller.)
		

		// explicitly states how many forces are used.
		// will probably need more nuanced way to do this
		// when adding different models.
		var forces;
		// var evap;


		while(this.linkTime < tGoal) {

			// if want to step beyond end of simulation
			// correct hstep and tGoal to land on end time
			if (this.linkTime + this.hstep > end){
				// Can't go past end
				tGoal = end;
				this.hstep = tGoal - this.linkTime;
			}

			var p = this.getPrecip(this.linkTime);
			if (p[1] < this.linkTime + this.hstep){
				// now max w/o discontinuity
				this.hstep = p[1] - this.linkTime;
			}

			// get evaporative forcings
			// forces = [evapPond, evapSub, pVal]
			forces = this.getEvap();
			// forces = forces.concat(p[0]);
			forces[forces.length-1] = p[0];

			// solver does RK4 or DOPRI
			// stores new vals etc.
			this.solver(forces);
		}
	}

	firstStep(manual=undefined){
		// Hairer 1987
		// "Starting Step Size" Routine
		// page 182

		// a) eval f(x_0, y_0)

		// b) calc

		// 	den = [frac{1}{max(x_0, x_end)}]^{1+p} + \norm{f}^{p+1}

		// c) calc

		// 	h = [/frac{tol}{den}]^{1/(p+1)}

		// d) do one euler step with h

		// e) repeat a) - c) with new initial value

		// f) set initial step size, h, to be

		// 	h = min(h1, h2) // h1 from the 1st cycle, h2 from 2nd
		

		var den, f, fnorm, forces, p, h1, h2, pow, tol, method;

		var Y = this.state.slice();

		if (GBL.solver.method === "DOPRI"){
			method = DOPRI;
		} else {
			method = RK4;
		}

		// a)
		forces = this.getEvap(0);
		p = this.getPrecip(0);
		forces[forces.length-1] = p[0];
		// forces[2] = p[0];
		// forces = forces.concat(p[0]);
		
		// Y is supplied as Y_0
		f = this.dydt(Y,0,forces);
		fnorm = f[0];
		for (var i = 1; i < f.length; i++) {
			fnorm = Math.max(fnorm,f[i]);
		}

		// b) calc both den and tol
		den = Math.pow(1/end, 1/method.pow) + Math.pow(fnorm, 1/method.pow);

		tol = Infinity;
		for (var i = Y.length - 1; i >= 0; i--) {
			let toli = Y[i] * GBL.solver.rel[i] + GBL.solver.abs[i];
			tol = Math.min(tol, toli);
		}

		// c) h = [/frac{tol}{den}]^{1/(p+1)}
		h1 = Math.pow(tol/den,method.pow);

		// d) one euler step
		for (var i = 0; i < Y.length; i++) {
			Y[i] = Math.max(Y[i] + f[i] * h1, GBL.limits[i]);
		}

		// e) repeat a'
		forces = this.getEvap(h1);
		p = this.getPrecip(h1);
		forces[forces.length-1] = p[0];
		// forces = forces.concat(p[0]);
		// forces[2] = p[0];


		f = this.dydt(Y,h1,forces);
		fnorm = f[0];
		for (var i = 1; i < f.length; i++) {
			fnorm = Math.max(fnorm,f[i]);
		}

		// repeat b'
		den = Math.pow(1/end, 1/method.pow) + Math.pow(fnorm, 1/method.pow);
		// only calc tol
		tol = Infinity;
		for (var i = Y.length - 1; i >= 0; i--) {
			let toli = Math.abs(Y[i]) * GBL.solver.rel[i] + GBL.solver.abs[i];
			tol = Math.min(tol, toli);
		}

		// repeat c'
		h2 = Math.pow(tol/den,method.pow);


		this.hstep = Math.min(120,Math.max(1,parseInt(Math.min(h1,h2))));
	}
}