// Solvers:
// RK4
// [DOPRI in Development... tbd.]

// Each solver includes three things
// 1. Vars, coefficients, etc.
// 2. Solvers
// 3. Beta Functions

// ---------  RK4   ---------
// --------------------------
// 1. Vars, coefficients, etc
// --------------------------
var RK4 = {"pow":(1/5),"a":[0.0, 0.5, 0.5, 1.0],"c":[0.0, 0.5, 0.5, 1.0]};

// -------------------
// 2. Solver Functions
// -------------------
function RK4solver(forcings) {
	// 1. RK4 w/ full step
	// 2a. RK4 to half step
	// 2b. Use 2a to calc RK4 at full step
	// 3. Calculate error
	// 4. if (error < thresh) -> accept step, calc next step size
	//    else redo RK4 w/ step that fits error criteria.
	// 5. Store accepted results in mem obj.

	var hstep, i, t;
	var tUnix = this.linkTime; // Initial value value from last values
	var Y = this.state;

	// 1. RK4 w/ full step
	var yTry = this.RK4(Y, tUnix, this.hstep, forcings, true);
	var kTry = yTry.slice(1);
	yTry = yTry[0]; // min check in rk4 routine


	// 2a. RK4 to half step
	// No need to keep these ks for now.
	var halfstep = this.hstep/2;
	var yHalf = this.RK4(Y, tUnix, halfstep, forcings); // no ks returned

	// 2b. Use 2a to calc RK4 at full step
	var yWhole = this.RK4(yHalf, tUnix + halfstep, halfstep, forcings); // no ks returned


	// 3. Calc Error
	i = 0;
	var errMax = Infinity; // reversed infinity means no different between the two.
	for (i; i < yTry.length; i++){
		// numerator is triangle0
		// denominator is triangle1
		let err = Math.abs(yTry[i] * GBL.solver.rel[i] / (yTry[i] - yWhole[i]));
		err = err || Infinity; // Stopgap against comparing NaN.
		errMax = Math.min(errMax,err);
	}

	// old hstep
	hstep = this.hstep;
	t = hstep;

	// calculate hnew to either redo this step,
	// or send it on to the next time.
	this.hstep = Math.pow(errMax,RK4.pow) * hstep;

	// Floor for hstep is 2 ms 
	// this.hstep = Math.max(this.hstep,2);
	this.hstep = Math.max(this.hstep,1); // min is one second
	this.hstep = Math.min(hstep*10,this.hstep); // for min one second.
	this.hstep = parseInt(this.hstep); // Make step a whole num for tUnix

	if (this.hstep < hstep) {
		// means don't accept the step,
		// step from Y with hnew
		// do rk4 to find Y at tUnix + hnew.

		// get yTry for the adjusted step size
		yTry = this.RK4(Y,tUnix,this.hstep,forcings,true);
		kTry = yTry.slice(1);
		yTry = yTry[0]; // min check in rk4 routine

		t = this.hstep;
	}
	

	// 5. Store accepted results in mem obj.
	// Accept step for t, Y
	// Upate Concat
	var i = 0;
	for (i; i < this.keepStates.length; i++){
		let memKey = this.keepStates[i];
		let targetInd = this.mem[memKey].length - 1;
		this.mem[memKey][targetInd] = this.mem[memKey][targetInd].
		concat([
			kTry[0][memKey],
			kTry[1][memKey],
			kTry[2][memKey],
			kTry[3][memKey]
		]);

		this.mem[memKey].push([yTry[memKey]])
	}

	this.state = yTry;

	// push new time to timeStack in chrono order
	var newTime = tUnix	+ t;
	this.linkTime = newTime;
	this.timeStack.push(newTime);
};

function fRK4(Y,tUnix,hstep,forcings,returnKs=false){
	
	// Do standard RK4 step calculations
	// return estimation of step.
    // this.mem[memKey][t_key] = [ q(t), k1, k2, k3, k4 ]
	

	var k1,k2,k3,k4,i;
	var yWalk = []; yWalk.length = Y.length;
	var yStep = []; yStep.length = Y.length;

	// RK4 constant coefficients
	var a = RK4.a; var c = RK4.c; var limits = GBL.limits.slice();
	var hstepMinutes = hstep * this.min2sec;

	// ---- K1 ----
	// a[0] is zero -- don't use.
	k1 = this.dydt(
		Y,
		tUnix,
		forcings
		);

	// ---- K2 ----
	var stepAndA = a[1] * hstepMinutes;
	for (i = 0; i < yWalk.length; i++){
		let y =  Y[i] + k1[i] * stepAndA;
		// check for minimum.
		yWalk[i] = Math.max(limits[i],y);
	}
	k2 = this.dydt(
		yWalk,
		tUnix + c[1] * hstep,
		forcings
		);

	// ---- K3 ----
	var stepAndA = a[2] * hstepMinutes;
	for (i = 0; i < yWalk.length; i++){
		let y = Y[i] + k2[i] * stepAndA;
		// check for minimum.
		yWalk[i] = Math.max(limits[i],y);
	}
	k3 = this.dydt(
		yWalk,
		tUnix + c[2] * hstep,
		forcings
		);

	// ---- K4 ----
	var stepAndA = a[3] * hstepMinutes;
	for (i = 0; i < yWalk.length; i++){
		let y = Y[i] + k3[i] * stepAndA;
		// check for minCheck
		yWalk[i] = Math.max(limits[i],y);
	}
	k4 = this.dydt(
		yWalk,
		tUnix + c[3] * hstep,
		forcings
		);

	var H = 1/6 * hstepMinutes;
	for (i=0; i < yWalk.length; i++){
		let y = Y[i] + H * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
		yStep[i] = Math.max(limits[i],y);
	}

	if (returnKs){
		// return [yStep,[k1[0],k2[0],k3[0],k4[0]]];
		return [yStep,k1,k2,k3,k4];
	} else {
		return yStep;
	}
};


// -------------------
// 3. Beta functions
// -------------------
function calcBetasRK4(theta){
	var betas = [0.0, 0.0, 0.0, 0.0];
	var pow2 = theta * theta;
	var twoThirds_pow3 = 2/3 * pow2 * theta;

	betas[0] = theta - 1.5 * pow2 + twoThirds_pow3;
	betas[1] = pow2 - twoThirds_pow3;
	betas[2] = betas[1];
	betas[3] = -0.5 * pow2 + twoThirds_pow3;

	return betas;	
};


// 
// --------  DOPRI  ---------
// --------------------------

// ... in development. TBD.