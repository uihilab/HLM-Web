/*
Title: HLM-Web in BMI standard
Author: Gregory Ewing
Date: January 2022

About: Refactored HLM-Web to use the Basic Model interface standard
*/

/**
 * Class definition of the HLM model that is BMI-compliant.
 * @class HLM
 * @extends BMI
 * @returns {Object} creates a new instance of an HLM model
 */
export default class HLM extends BMI {
	/**
	 * Creates an `HLM` instance.
	 * If no configuration file given, then it only initializes an empty shell.
	 * Otherwise, passes config string to `initialize` method.
	 * @param {string} configfile - string path to json configuration file.
	 */
	constructor(configfile=undefined){
		super();
		if (configfile){this.initialize(configfile);}
	}


	/**
	 * Intialize the HLM instance with data.
	 * @param {string} configfile - string path to json configuration file.
	 * @throws Will throw an error if no path is provided to configuration file.
	 */
	initialize(configfile=undefined){
		//supply string to gbl.js config file.
		if (configfile){
			fetch(configfile).then(response => response.json()).then(data => {
				this._modelCode = data['model'];
				this._modelName = data['modelName'];
				this._startStr = data['begin'];
				this._startDt = new Date(data['begin']);
				this._now = 0;
				this._endStr = data['end'];
				this._endDt = new Date(data['end']);
				this._end = (this._endDt - this._startDt)/1000; // [sec]
				this._defaultStep = data["defaultStep"];

				this.links = {};
				this.keepLinks = data['keep'];
				this.solver = data['solver'];
				// this.initialConditions = data['ics']['vals'];
				this.forces = {};
				this.globalParams = data.globalParams;

				// Import Utilities from src
				// Then make Link objects
				Promise.all([import('./models.js'),import('./solvers.js')])
				.then( ([models,solvers]) => {
					this.handleModelConfig(models);
					this.handleSolverConfig(solvers);
				})
				.then( () => {
					this.makeLinks(data["simulationFiles"]);
				});
			});
		} else {
			// load test network
			throw Error("No config file given. Provide a json file with the proper structure.")
		}
	}

	/**
	 * Attaches proper mathematical models and supporting functions for the hydrological model designated in the configuration file.
	 * Sets BMI-compliant standard names for specifica variables in `_inNames` and `_outNames`.
	 * @param {object} models - object holding mathematical models. Fetched from `models.js`.
	 */
	handleModelConfig(models){
		switch(this._modelCode){
			case 190:
			this.dydt = models.model190;
			this.getEvap = models.getEvap190;

			// Standard Names
			this._inNames = [
				"atmosphere_water__rainfall_volume_flux",
				"land_surface_water__potential_evaporation_volume_flux"
			];
			this._inNamesSimple = [ "precip", "evap"];
			this._outNames = [
				"channel_water_x-section__volume_flow_rate",
				"land_surface_water__depth",
				"land_subsurface_water__effective_depth"
				];
			
			// Standard units
			this._inUnits = ["mm hr-1", "mm month-1"];
			this._outUnits = ["m3 s-1", "m", "m"];

			// where is the variable defined on the grid
			this._outLocations = ["node","node","node"];
			this._inLocations = ["node","node"];

			break;

			case 252:
			this.dydt = models.model252;
			this.getEvap = models.getEvap252;

			// Standard Names
			this._inNames = [
				"atmosphere_water__rainfall_volume_flux",
				"land_surface_water__potential_evaporation_volume_flux"
				];
			this._inNamesSimple = [ "precip", "evap"];
			this._outNames = [
				"channel_water_x-section__volume_flow_rate",
				"land_surface_water__depth",
				"toplayer_soil__effective_water_depth",
				"land_subsurface_water__effective_depth",
				"atmosphere_water__total_rainfall_volume",
				"land_surface_water__total_volume_flux",
				"land_subsurface_water__volume_flow_rate"
				];

			// Standard units
			this._inUnits = ["mm hr-1", "mm month-1"];
			this._outUnits = ["m3 s-1", "m", "m", "m", "m", "m3 s-1", "m3 s-1"];
			
			// where is the variable defined on the grid
			this._inLocations = ["node","node"];
			this._outLocations = ["node","node","node","node","node","node","node"];
			break;
		};
	};

	/**
	 * Attaches to the `HLM` instance functions associated to the numerical engine.
	 * @param {object} solvers 
	 * @throws Currently throws if DOPRI solver is chosen.
	 */
	handleSolverConfig(solvers){
		switch(this.solver.method){
			case "RK4":
			this.stepper = solvers.RK4solver;
			this.calcBetas = solvers.calcBetasRK4;
			this.fsolve = solvers.fRK4;
			this.solver.coeffs = solvers.RK4;

			break;
			case "DOPRI":
			// Not implemented yet
			throw Error("Warning: DOPRI solver not implemented yet.");
		};
	};

	/**
	 * Fetches model input data and builds link objects
	 * @param {object} simFileURLs - object of file paths.
	 * @throws Throws error if one of the key input types are missing.
	 * 
	 * simFileURLs should have the following key-value pairs:
	 * 	'prm' : `<parameter data input filepath>.json`
	 * 	'rvr' : `<network topology data input filepath>.json`
	 *  'str' : `<forcing data filepath>.json`
	 *  'ics' : `<initial conditions data filepath>.json`
	 */
	makeLinks(simFileURLs){
		
		// check that all needed files are delivered
		// This is a pretty naive check -- just that the
		// string provided is a json file.
		var required = ['prm','rvr','str','ics'];
		var keys = Object.keys(simFileURLs);
		for (var i in required){
			if (!keys.includes(required[i])){
				throw Error("Missing file path: " + required[i] + "file type not included in simulationFiles object in the configuration file.")
			}
		}

		Promise.all([
			fetch(simFileURLs['prm']),
			fetch(simFileURLs['rvr']),
			fetch(simFileURLs['str']),
			fetch(simFileURLs['ics'])
			])
		.then(function (responses) {
			// Get a JSON object from each of the responses
			return Promise.all(responses.map(function (response) {
				return response.json();
			}));
		})
		.then((jsonData) => {
			this.parseLinkData(jsonData);
		});
		// .catch( () => {throw 'Error fetching input data.';});
	}

	/**
	 * Puts prm, rvr, str, ic data to a this.linkData attribute.
	 * Then parses these data inputs into new Link objects
	 * properties of HLM model object.
	 * @param {object} linkData 
	 */
	parseLinkData(linkData){
		// parse input data (linkData) by the expected keys in the object
		var prms, forces, ics;
		let keys = ["prm", "rvr", "forces", "ICs"];
		for (let i in linkData){
			switch (linkData[i]['dtype']){
				case "rvr":
					this.network = linkData[i].data;
					break;
				case "prm":
					prms = linkData[i].data;
					break;
				case "forces":
					forces = linkData[i];
					model.forces = linkData[i].ftype;
					break;
				case "ICs":
					ics = linkData[i].data;
					break;
			}
		}

		// Use linkData to build Link objects within the
		// links object within the HLM model object
		let i;
		for (i in prms){
			let id = prms[i][0];
			let forcing = this.getLinkForces(forces,id);			
			let ic = (ics.links[id]) ? ics.links[id] : ics.links[0];
			this.links[id] = new Link(prms[i],this.network.topology[id],forcing,ic);
		}
	}

	/**
	 * Get and organize forcing data for an individual link
	 * @param {object} data - forcing data
	 * @param {string} target - link id to get forcing for
	 * @throws Throws error if data object provided is not properly formatted.
	 * @returns {object} object of forcing data 
	 */
	 getLinkForces(data,target){
		var packet = {}
		if (data["dtype"] !== "forces"){throw Error("Check force file; missing \"dtype\" : \"forces\".");}
		for (var i in data["ftype"]){
			let f = data["ftype"][i];

			if(data["isUniform"][f] || !Object.keys(data.data.links).includes(String(target))){
				packet[f] = data["data"]["links"]["0"][f];
			} else {
				packet[f] = data["data"]["links"][target][f];
			}
		}
		return packet;
	}

	/**
	 * Advance model by one DEFAULT timestep
	 * Default timestep is set in the config file.
	 * 
	 * default timestep is meant to standardize
	 * the timesteps of each hillslope link
	 * over all of the dynamically stepping links
	 * @method update
	 * @memberof BMI
	 */
	update(){
		// default value for update_until is:
		// this._now + this._defaultStep
		this.update_until();
	}

	/**
	 * Steps model until a specified time, `tGoal`.
	 * `tGoal` unit is seconds since beginning of simulation
	 * @method update_until
	 * @memberof BMI
	 * @param {number} tGoal
	 */
	update_until(tGoal = this._now + this._defaultStep){
		// updates a model to a particular time
		var tGoal = Math.min(model._end,tGoal);
		var linkOrder = this.getLinkOrder();
		for (var l in linkOrder){
			if (this.links[linkOrder[l]].hstep === "null"){
				// calculate first step.
				this.links[linkOrder[l]].firstStep();
			}

			// send link id and time goal the stepper method
			this.links[linkOrder[l]].step(tGoal);

			/**
			 * This is memory cleanup.
			 * The logic to implement would be to wipe mem from links
			 * that are not included in keep. and only keep link state
			 * and then reinitialize mem.
			 * 
			 * Could be implemented in a different way with the BMI
			 * implementation
			 */
			// let p;
			// for (p = 0; p < this.links[linkOrder[l]].parents.length; p++) {
			// 	if (!this.keepLinks.includes(this.links[linkOrder[l]].parents[p])){
			// 		this.links[this.links[linkOrder[l]].parents[p]] = undefined;
			// 	}
			// }		
		}
		this._now = tGoal;
	}

	/**
	 * Return link order to step the solution
	 * of the links.
	 * @returns {[number...]}
	 * 
	 * Could house a variety of different logics.
	 * Would be helpful to find a post-order DFS alg
	 * in JS to plug into here.
	 */
	getLinkOrder(){return this.network.order;}

	/**
	 * Perform all tasks that take place after exiting
	 * model time loop (ie. memory cleanup, closing files, reporting)
	 * 
	 * Potential Tasks:
	 * - garbage collection stuff
	 * - provide outputs in even intervals
	 */
	finalize(){}

	/**
     * Gets name of the component.
     * @method get_component_name
     * @memberof BMI
     * @return {String} - The name of the component
     */
	get_component_name(){return this._modelName + ' - ' + this._modelCode;}


	/**
     * Count of a model's input variables.
     * @method get_input_item_count
     * @memberof BMI
     * @return {Number} - The number of input variables.
	 * Number of variables model can  use from other models implementing a BMI.
     */
	get_input_item_count(){return this._inNames.length;}

	/**
	 * Gets an array of names for the variables the model can 
	 * use from other models implementing a BMI. The length of 
	 * the array is given by get_input_item_count. The names 
	 * are preferably in the form of CSDMS Standard Names.
	 * @method get_input_var_names
	 * @memberof BMI
	 * @returns {[string...]}
	 */
	get_input_var_names(){return this._inNames;}


	 /**
     * Count of a model's output variables.
     * @method get_output_item_count
     * @memberof BMI
     * @return {Number} - The number of output variables.
     */
	get_output_item_count(){return this._outNames.length;}

	/**
	 * Gets an array of names for the variables the model can 
	 * provide to other models implementing a BMI. The length 
	 * of the array is given by get_output_item_count. The names 
	 * are preferably in the form of CSDMS Standard Names.
	 * @method get_output_var_names
	 * @memberof BMI
	 * @returns {[string...]}
	 */
	get_output_var_names(){return this._outNames;}

	/**
     * Returns an identifier of the grid upon which the
	 * 'var_name' is defined. HLM only uses one grid.
	 * Grids indexed from 0
     * @method get_var_grid
     * @memberof BMI
     * @param {String} name - An input or output variable name, a CSDMS Standard Name
     * @return {Number} - The grid identifier.
     */
	get_var_grid(var_name){return 0;}


	/**
	 * Helper method to provide the index of a variable
	 * can parse all variables, regardles of input names
	 * or output names.
	 * @method get_var_ind
	 * @param {string} var_name 
	 * @returns {number} - the variable index
	 */
	get_var_ind(var_name){
		if ( this._inNames.indexOf(var_name) !== -1){
			return ["_in", this._inNames.indexOf(var_name)];
		} else if ( this._outNames.indexOf(var_name) !== -1){
			return ["_out", this._outNames.indexOf(var_name) ];
		} else {
			throw Error('Error: variable name not found');
		}
	}

	/**
     * Get data type of the given variable.
     * @method get_var_type
     * @memberof BMI
     * @param {String} name - An input or output variable name, a CSDMS Standard Name
     * @return {String} - The variable type; e.g., "str", "int", "float".
     */
	get_var_type(var_name){return typeof 0.0;} // only one number format for JS
	
	/**
     *  Get units of the given variable.
     *  Standard unit names, in lower case, should be used, such as
     *  "meters" or "seconds". Standard abbreviations, like "m" for
     *  meters, are also supported. For variables with compound units,
     *  each unit name is separated by a single space, with exponents
     *  other than 1 placed immediately after the name, as in "m s-1"
     *  for velocity, "W m-2" for an energy flux, or "km2" for an
     *  area.
     * @method get_var_units
     * @memberof BMI
     * @param {String} name - An input or output variable name, a CSDMS Standard Name
     * @return {String} - The variable units.
     */
	get_var_units(var_name){
		let loc,ind,unit;
		[loc,ind] = this.get_var_ind(var_name);

		// handle both in and out vars
		switch(loc){
			case "_in":
				unit = this._inUnits[ind].slice();
				break;
			case "_out":
				unit = this._outUnits[ind].slice();
				break;
		}
		return unit;
	}

	/**
     * Get memory use for each array element in bytes
     * @method get_var_itemsize
     * @memberof BMI
     * @param {String} name - An input or output variable name, a CSDMS Standard Name
     * @return {Number} - Item size in bytes.
     */
	get_var_itemsize(var_name){
		let type = this.get_var_type(var_name);
		if (type === "number"){return 8;}
	}

	/**
     * Get size, in bytes, of the given variable
     * @method get_var_nbytes
     * @memberof BMI
     * @param {String} name - An input or output variable name, a CSDMS Standard Name
     * @return {Number} - The size of the variable, counted in bytes.
     */
	get_var_nbytes(var_name){return this.get_var_itemsize(var_name) * this.network.order.lenth;}
	
	/**
     * Get the grid element type that the a given variable is defined on.
     * The grid topology can be composed of *nodes*, *edges*, and *faces*.
     * *node*
     *     A point that has a coordinate pair or triplet: the most
     *     basic element of the topology.
     * *edge*
     *     A line or curve bounded by two *nodes*.
     * *face*
     *     A plane or surface enclosed by a set of edges. In a 2D
     *     horizontal application one may consider the word “polygon”,
     *     but in the hierarchy of elements the word “face” is most common.
     * @method get_var_location
     * @memberof BMI
     * @param {String} name - An input or output variable name, a CSDMS Standard Name
     * @return {String} - The grid location on which the variable is defined. Must be one of "node", "edge", or "face".
     */
	get_var_location(var_name){
		let loc,ind,vloc;
		[loc,ind] = this.get_var_ind(var_name);

		switch (loc) {
			case "_in":
				vloc = this._inLocations[ind];
				break;
			case "_out":
				vloc = this._outLocations[ind];
				break;
		}
		return vloc;
	}

	/**
	 * Current time of the model
	 * @method current_time
	 * @memberof BMI
	 * @param {String} name - An input or output variable name, a CSDMS Standard Name
	 * @return {Number} - The current model time.
	 */
	get_current_time(){return this._startDt.setSeconds(this._startDt + this._now);}

	/**
     * Start time of the model. Model times should be of type float
     * @method start_time
     * @memberof BMI
     * @return {Number} -The model start time.
     */
	get_start_time(){return this._startDt;} 

	/**
     * End time of the model
     * @method end_time
     * @memberof BMI
     * @return {Number} -The maximum model time.
     */
	get_end_time(){return this._endDt;}

	/**
     * Time units of the model
     * @method time_units
     * @memberof BMI
     * @return {String} -The model time unit; e.g., 'days' or 's'.
     */
	get_time_units(){return 's'}

	/**
     * Current time step of the model.
	 * HLM implementation is the DEFAULT time step.
     * @method time_step
     * @memberof BMI
     * @return {Number} -The time step used in model.
     */
	get_time_step(){return this._defaultStep;}
	
	/**
     *  Get a copy of values of the given variable.
     *  This is a method for the model, used to access the model's
     *  current state. It returns a *copy* of a model variable, with
     *  the return type, size and rank dependent on the variable.
     * @method get_value
     * @memberof BMI
     * @param {String} name - An input or output variable name, a CSDMS Standard Name
     * @param {Object[]} dest - A array into which to place the values
     * @return {Object[]} -The same array that was passed as an input buffer.
     */
	get_value(var_name, dest){
		return this.get_value_at_indices(var_name, dest, this.network.order);
	}

	/**
	 * NOT IMPLEMENTED IN JS
     *  Get a reference to values of the given variable.
     *  This is a method for the model, used to access the model's
     *  current state. It returns a reference to a model variable,
     *  with the return type, size and rank dependent on the variable.
     * @method get_value_ptr
     * @memberof BMI
     * @param {String} name - An input or output variable name, a CSDMS Standard Name
     * @return {Object[]} -A reference to a model variable.
     */
	get_value_ptr(var_name){return "ERROR: Not Implemented in JS, Passing Reference Not Possible.";}

	/**
     * Get values at particular indices.
     * @method get_value_at_indices
     * @memberof BMI
     * @param {String} name - An input or output variable name, a CSDMS Standard Name
     * @param {Object[]} dest - An array into which to place the values
     * @param {Object[]} inds - The indices into the variable array
     * @return {Object[]} -Value of the model variable at the given location.
     */
	get_value_at_indices(var_name, dest, indices){
		let loc,ind,i;
		[loc,ind] = this.get_var_ind(var_name);

		for (i = 0; i < indices.length; i++){
			let linkID = indices[i];
			switch (loc) {
				case "_out":
					dest.push(this.links[linkID].state.slice()[ind]);
					break;
				case "_in":
					switch (this._inNamesSimple[ind]){
						case "evap":
							let month = new Date(this._startDt.getTime() + this.links[linkID].linkTime*1000).getMonth();
							dest.push(this.links[linkID]["evap"][month]);
						break;
						case "precip":
							dest.push(this.links[linkID].getPrecip(this.links[linkID].linkTime)[0]);
						break;
					}
					break;
			}
		}
		return dest;
	}

	/**
     * Specify a new value for a model variable.
     * This is the setter for the model, used to change the model's
     * current state. It accepts, through *src*, a new value for a
     * model variable, with the type, size and rank of *src*
     * dependent on the variable.
     * @method set_value
     * @memberof BMI
     * @param {String} name - An input or output variable name, a CSDMS Standard Name
     * @param {Object[]} src - The new value for the specified variable
     */
	set_value(var_name, src){
		var dest = this.set_value_at_indices(var_name, this.network.order, src);
		return dest;
	}

	/**
     * Specify a new value for a model variable at particular indices.
     * @method set_value_at_indices
     * @memberof BMI
     * @param {String} name - An input or output variable name, a CSDMS Standard Name
     * @param {Object[]} inds - The indices into the variable array
     * @param {Object[]} src - The new value for the specified variable
     */
	set_value_at_indices(var_name, indices, src){
		if (indices.length !== src.length){
			throw Error("Unequal array lengths for inds and src");
		} else {
			let loc,ind,i;
			[loc,ind] = this.get_var_ind(var_name);

			for (i = 0; i < indices.length; i++){
				let linkID = indices[i];
				
				switch(loc){
					case "_out":
						let timeInd = this.links[linkID].timeStack.length - 1;
						this.links[linkID].state[ind] = src[i];
						this.links[linkID].mem[ind][timeInd] = [src[i]];
						break;
					case "_in":
						switch (this._inNamesSimple[ind]){
							case "evap":
								let month = new Date(this._startDt.getTime() + this.links[linkID].linkTime*1000).getMonth();
								this.links[linkID]["evap"][month] = src[i];
							break;
							case "precip":
								// dest.push(this.links[linkID].getPrecip(this.links[linkID].linkTime)[0]);
								let tInd = searchInsert(this.links[linkID].precip.t,this.links[linkID].linkTime);
								if (this.links[linkID].linkTime === this.links[linkID].precip.t[tInd]){
									this.links[linkID].precip.v[tInd] = src[i];
								} else {
									this.links[linkID].precip.t.splice(tInd,0,this.links[linkID].linkTime);
									this.links[linkID].precip.v.splice(tInd,0,src[i]);
								}
							break;
						}
						break;
				}
			}
			return true;
		}
	}

	/**
     * Get number of dimensions of the computational grid.
     * @method get_grid_rank
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @return {Number} Rank of the grid.
     */
	get_grid_rank(grid_id){return 1;}

	/**
     * Get the total number of elements in the computational grid.
     * @method get_grid_size
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @return {Number} Size of the grid.
     */
	get_grid_size(grid_id){return this.network.order.length;}

	/**
     * Get the grid type as a string.
	 * HLM grid is an unstructured grid per BMI grid specifications
	 * 
	 * HLM models are formulated as directed trees
     * @method get_grid_type
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @return {String} Type of grid as a string.
     */
	get_grid_type(grid_id){return 'unstructured';}

	/**
     * Get dimensions of the computational grid
     * @method get_grid_shape
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @param {Object[] of Number, shape *(ndim,)*} shape - A array into which to place the shape of the grid.
     * @return {Object[] of Number} The input array that holds the grid's shape.
     */
	get_grid_shape(grid_id){throw Error('BMI_FAILURE: Not Implemented');}

	/**
     * Get dimensions of the computational grid
     * @method get_grid_spacing
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @param {Object[] of Number, shape *(ndim,)*} spacing - A array to hold the spacing between grid rows and columns.
     * @return {Object[] of Number} The input array that holds the grid's spacing.
     */
	get_grid_spacing(grid_id){throw Error('BMI_FAILURE: Not Implemented');}

	/**
     * Get coordinates for the lower-left corner of the computational grid.
     * @method get_grid_origin
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @param {Object[] of Number, shape *(ndim,)*} origin - An array to hold the coordinates of the lower-left corner of the grid.
     * @return {Object[] of Number} The input array that holds the coordinates of the grid's lower-left corner.
     */
	get_grid_origin(grid_id){throw Error('BMI_FAILURE: Not Implemented');}

	/**
     * Get coordinates of grid nodes in the x direction.
     * @method get_grid_x
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @param {Object[] of Number, shape *(nrows,)*} x - An array to hold the x-coordinates of the grid node columns
     * @return {Object[] of Number} The input array that holds the grid's column x-coordinates.
     */
	get_grid_x(grid_id){throw Error('BMI_FAILURE: Not Implemented');}

	/**
     * Get coordinates of grid nodes in the y direction.
     * @method get_grid_y
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @param {Object[] of Number, shape *(ncols,)*} y - An array to hold the y-coordinates of the grid node rows
     * @return {Object[] of Number} The input array that holds the grid's row y-coordinates
     */
	get_grid_y(grid_id){throw Error('BMI_FAILURE: Not Implemented');}

	/**
     * Get coordinates of grid nodes in the z direction.
     * @method get_grid_z
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @param {Object[] of Number, shape *(nlayers,)*} z - An array to hold the z-coordinates of the grid nodes layers.
     * @return {Object[] of Number} The input array that holds the grid's layer z-coordinates.
     */
	get_grid_z(grid_id){throw Error('BMI_FAILURE: Not Implemented');}
	
	/**
     * Get the number of nodes in the grid.
     * @method get_grid_node_count
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @return {Number} The total number of grid nodes
     */
	get_grid_node_count(grid_id){return this.network.order.length;}

	/**
     * Get the number of edges in the grid
     * @method get_grid_edge_count
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @return {Number} The total number of grid edges
     */
	get_grid_edge_count(grid_id){throw Error('BMI_FAILURE: Not Implemented');}

	/**
     * Get the number of faces in the grid.
     * @method get_grid_face_count
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @return {Number} The total number of grid faces.
     */
	get_grid_face_count(grid_id){throw Error('BMI_FAILURE: Not Implemented');}

	/**
     * Get the edge-node connectivity.
     * @method get_grid_edge_nodes
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @param {Object[] of Number, shape *(2 x nnodes,)*} edge_nodes - An array to place the edge-node connectivity. For each edge, connectivity is given as node at edge tail, followed by node at edge head.
     * @return {Object[] of Number} The input array that holds the edge-node connectivity.
     */
	get_grid_edge_nodes(grid_id){throw Error('BMI_FAILURE: Not Implemented');}

	/**
     * Get the face-edge connectivity.
     * @method get_grid_face_edges
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @param {Object[] of Number} face_edges - An array to place the face-edge connectivity.
     * @return {Object[] of Number} The input array that holds the face-edge connectivity.
     */
	get_grid_face_edges(grid_id){throw Error('BMI_FAILURE: Not Implemented');}

	/**
     * Get the face-edge connectivity.
     * @method get_grid_face_nodes
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @param {Object[] of Number} face_nodes - An array to place the face-node connectivity. For each face, the nodes (listed in a counter-clockwise direction) that form the boundary of the face.
     * @return {Object[] of Number} The input array that holds the face-node connectivity.
     */
	get_grid_face_nodes(){throw Error('BMI_FAILURE: Not Implemented');}

	/**
     * Get the face-edge connectivity.
     * @method get_grid_nodes_per_face
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @param {Object[] of Number, shape *(nfaces,)*} nodes_per_face - An array to place the number of nodes per face.
     * @return {Object[] of Number} The input array that holds the number of nodes per face.
     */
	get_grid_nodes_per_face(){throw Error('BMI_FAILURE: Not Implemented');}
};

/**
 * Class definition of the HLM model that is BMI-compliant.
 * @class Link
 * @returns {Object} creates a new instance of an HLM model
 */
class Link{
	/**
	 * 
	 * @param {object[]} paramArray - An array of link parameters
	 * @param {object[]} parents - An array of link ids that drain to current link
	 * @param {object[]} forcings - An object of forcings at the link (e.g. evap & precip)
	 * @param {object[]} initialCondition - An array of initial states of the link
	 */
	constructor (
		paramArray=undefined,
		parents=undefined,
		forcings=undefined,
		initialCondition=undefined
		){
		if (paramArray){this.initialize(paramArray,parents,forcings,initialCondition);}
		else {this.id = undefined;}
	}

	/**
	 * Make Link object
	 * @method initialize
	 * @memberof Link
	 * @param {object[]} paramArray - An array of link parameters
	 * @param {object[]} parents - An array of link ids that drain to current link
	 * @param {object[]} forcings - An object of forcings at the link (e.g. evap & precip)
	 * @param {object[]} ic - An array of initial states of the link
	 */
	initialize(paramArray,parents,forcings,ic){
		// Initialize Dynamic Stepping [Hillslope] Link Object
		// Process:
		// 1. Add common attributes
		// 2. Add dydt model and supporting funcs
		// 3. Add Solver/Stepp and supporting funcs

		// ---------------------------------------
		// 3. Add Solver/Stepp and supporting funcs
		// ---------------------------------------
		this.solver = model.solver;
		this.stepper = model.stepper;
		this.calcBetas = model.calcBetas;
		this.fsolve = model.fsolve;


		// ---------------------------------------
		// 1. Add common attributes
		// ---------------------------------------
		// unique identifier
		this.id = paramArray[0];

		// ---- Time components, conversions ----
		this.linkTime = 0;
		this.timeStack = [this.linkTime];
		this.hstep = this.solver.firstStep;
		this.sec2min = 60; // 60 sec / 1 min
		this.min2sec = 1/60; // 1 min / 60 sec
		this.sec2hr = 3600;

		// ---- physical parameters, topo ----
		this.A  = paramArray[1]; // total area upsteam, still in km^2
		this.L = paramArray[2] * 1000; // km -> m
		this.A_h = paramArray[3] * 1e6; // km^2 -> m^2
		this.parents = parents;
		this.invtau = (60 * model.globalParams.v_r * Math.pow((this.A / model.globalParams.A_r), model.globalParams.lambda_2));
		this.invtau = this.invtau / ((1-model.globalParams.lambda_1) * this.L );
		this.k2 = model.globalParams.v_h * this.L / this.A_h * 60; // [1 / min]


		// ---------------------------------------
		// 2. Add dydt model and supporting funcs
		// ---------------------------------------
		this.initModel(ic);

		// ---------------------------------------
		// 4. Forces Processing
		// ---------------------------------------
		this.processForces(forcings);
		
		// this could be built out to include other utilities
		// These are other available options for specific use cases.
		// Contact Greg for the supporting code for these precip methods
	}

	/**
	 * Add mathematical model functions needed
	 * Then initialize state vars and some parameters
	 * @method initModel
	 * @param {object[]} ic - initial conditions
	 */
	initModel(ic){
		this.dydt = model.dydt;
		this.getEvap = model.getEvap;

		switch(model._modelCode){
			case 190:
				// states
				this.state = ic.slice(); // this.state.length = 3; // [ q ,  sp,  ss ]
				// mem
				this.mem = {0: [ [ this.state[0] ] ]};
				this.keepStates = [0]; //[q_channel]

				// model/link-specific vals
				this.k3 = model.globalParams.v_g * this.L / this.A_h * 60; // [1 / min]
				this.c1 = model.globalParams.RC * (0.001/60);
				this.c2 = (1 - model.globalParams.RC) * (0.001/60);
				break;
			case 252:
				// Set State
				// initArray should be of length 4
				// initial vals for [ q, sp, st, sp]
				// final vals: [q, sp, st, ss, s_precip, V_r, qb]
				this.state 		= ic.slice();
				// this.state 		= init.vals; this.state.length = 7; 
				// this.state[4] 	= 0.0;
				// this.state[5]	= 0.0;
				// this.state[6]	= init.vals[0];

				// set mem
				this.mem = {0: [ [ this.state[0] ] ], 6: [ [ this.state[6] ] ]};
				this.keepStates = [0,6]; //[q_channel, q_baseflow]
				
				// model/link-specific vals
				this.ki = this.k2 * model.globalParams.beta; 	// [1 / min]
				this.c1 = 0.001/60;					 	// []
				this.c2 = this.A_h / 60;
				this.q_r = 1;this.A_r = 1;this.s_r = 1;	// [m^3 s^-1], [L^2], [L]
				break;
		};
	}

	/**
	 * Attach forcings from inputs
	 * @param {object} forcings 
	 */
	processForces(forcings){
		let keys = Object.keys(forcings);
		for (var i in keys){
			this[keys[i]] = forcings[keys[i]];
		}
	}

	/**
	 * Given tUnix, return q for link
	 * Use dense method
	 * @param {number} tUnix - time where value is wanted
	 * @param {number} memKey - key in memory object of the save state var
	 * @returns {number} - value of the state at the tUnix
	 */
	getY(tUnix,memKey){ 
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

	/**
	 * Get precip forcing at given time and the time the forcing changes
	 * @method getPrecip
	 * @param {number} tUnix - time in seconds from the beginning of the model
	 * @returns {object[]} - [ pVal : precip forcing val at linkTime, tEnd : unix time of end of continuous p forcing ]
	 */
	getPrecip(tUnix) {
		var resultsArray = [0.0, 0.0];
		var index = this.precip.t.indexOf(tUnix);

		if (index === -1) { // Returns -1 if not in array
			// Find insert position
			index = searchInsert(this.precip.t,tUnix);
			resultsArray[0] = this.precip.v[Math.max(0,index-1)];
			resultsArray[1] = this.precip.t[index];
		} else { // Exact time in array
			resultsArray[0] = this.precip.v[index];
			resultsArray[1] = this.precip.t[index + 1];
		}

		// If t beyond end of array, resultsArray[1] is NaN.
		// Adjust tEnd to equal end.getTime();
		if (isNaN(resultsArray[1])){
			resultsArray[1] = model._end;
		}

		return resultsArray;
	}

	/**
	 * Returns a single numeric value at time t at the Link Object this.
	 * Iterate over all of the link's parents to sum their flow at time t provided.
	 * Used 'y' as a generic dependent var specify memKey to tell which var to search over
	 * @param {number} tUnix - time in seconds from the beginning of the model
	 * @param {number} memKey - key in memory object of the save state var
	 * @returns 
	 */
	yFromParents(tUnix,memKey=0){
		var y = 0;
		var i;

		for (var i = this.parents.length - 1; i >= 0; i--) {
			y += model.links[this.parents[i]].getY(tUnix,memKey);
		}
		return y;
	}

	/**
	 * Use integrator with multiple timesteps to determine 
	 * error and then update appropriate step size.
	 * this.hstep is the largest possible step the solver will take. 
	 * IF the forcings at this.linkTime and += this.hstep
	 * are the same, there will not be any discontinuities
	 * from the stepwise forcing functions in the integration
	 * approximation, even if hstep is changed because of
	 * error limits (hstep will get smaller.)
	 * @method step
	 * @memberof Link
	 * @param {number} tGoal - time in seconds from the beginning of the model
	 */
	step(tGoal=this.linkTime + this.hstep) {
		// explicitly states how many forces are used.
		// will probably need more nuanced way to do this
		// when adding different models.
		var forces;


		while(this.linkTime < tGoal) {
			// if want to step beyond end of simulation
			// correct hstep and tGoal to land on end time
			// if (this.linkTime + this.hstep > model._end){
			if (this.linkTime + this.hstep > tGoal){
				// Can't go past end
				// tGoal = model._end;
				this.hstep = tGoal - this.linkTime;
			}

			var p = this.getPrecip(this.linkTime);
			if (p[1] < this.linkTime + this.hstep){
				// now max w/o discontinuity
				this.hstep = p[1] - this.linkTime;
			}

			// get evaporative forcings
			forces = this.getEvap();
			forces[forces.length-1] = p[0];

			// solver steps, stores new vals etc.
			this.stepper(forces);
		}
	}

	/**
	 * Equates the length of the first step per 
	 * Hairer 1987, "Starting Step Size" Routine (page 182)
	 * a) eval f(x_0, y_0)
	 * b) calc
	 * 		den = [frac{1}{max(x_0, x_end)}]^{1+p} + \norm{f}^{p+1}
	 * c) calc
	 * 		h = [/frac{tol}{den}]^{1/(p+1)}
	 * d) do one euler step with h
	 * e) repeat a) - c) with new initial value
	 * f) set initial step size, h, to be
	 * 		h = min(h1, h2) // h1 from the 1st cycle, h2 from 2nd
	 * @method firstStep
	 * @memberof Link
	 * @param {number} manual 
	 */
	firstStep(manual=undefined){
		var den, f, fnorm, forces, p, h1, h2, pow, tol;

		var Y = this.state.slice();

		// a)
		forces = this.getEvap(0);
		p = this.getPrecip(0);
		forces[forces.length-1] = p[0];
		
		// Y is supplied as Y_0
		f = this.dydt(Y,0,forces);
		fnorm = f[0];
		for (var i = 1; i < f.length; i++) {
			fnorm = Math.max(fnorm,f[i]);
		}

		// b) calc both den and tol
		den = Math.pow(1/model._end, 1/this.solver.coeffs.pow) + Math.pow(fnorm, 1/this.solver.coeffs.pow);

		tol = Infinity;
		for (var i = Y.length - 1; i >= 0; i--) {
			let toli = Y[i] * this.solver.err.rel[i] + this.solver.err.abs[i];
			tol = Math.min(tol, toli);
		}

		// c) h = [/frac{tol}{den}]^{1/(p+1)}
		h1 = Math.pow(tol/den,this.solver.coeffs.pow);

		// d) one euler step
		for (var i = 0; i < Y.length; i++) {
			Y[i] = Math.max(Y[i] + f[i] * h1, this.solver.limits[i]);
		}

		// e) repeat a'
		forces = this.getEvap(h1);
		p = this.getPrecip(h1);
		forces[forces.length-1] = p[0];

		f = this.dydt(Y,h1,forces);
		fnorm = f[0];
		for (var i = 1; i < f.length; i++) {
			fnorm = Math.max(fnorm,f[i]);
		}

		// repeat b'
		den = Math.pow(1/model._end, 1/this.solver.coeffs.pow) + Math.pow(fnorm, 1/this.solver.coeffs.pow);
		// only calc tol
		tol = Infinity;
		for (var i = Y.length - 1; i >= 0; i--) {
			let toli = Math.abs(Y[i]) * this.solver.err.rel[i] + this.solver.err.abs[i];
			tol = Math.min(tol, toli);
		}

		// repeat c'
		h2 = Math.pow(tol/den,this.solver.coeffs.pow);

		this.hstep = Math.min(120,Math.max(1,parseInt(Math.min(h1,h2))));
	}
};


/**
 * Returns the index in an array that the target number should be inserted at.
 * @param {object[]} nums - an array of numbers in ascending order
 * @param {number} target - number that you want to insert into nums array
 * @returns {number} - index where target should be inserted
 */
export var searchInsert = function(nums, target) {
	// Author: Primary Objects
	// https://gist.github.com/primaryobjects
	// Source:
	// https://gist.github.com/primaryobjects/117017f85769124c28c858f8735f27d8
	// I think I only changed one line of this code. Good code!
    var start = 0;
    var end = nums.length - 1;
    var index = Math.floor((end - start) / 2) + start;
    
    if (target > nums[nums.length-1]) {
        // The target is beyond the end of this array.
        index = nums.length;
    }
    else {
        // Start in middle, divide and conquer.
        while (start < end) {
            // Get value at current index.
            var value = nums[index];
            
            if (value === target) {
                break;
            }
            else if (target < value) {
                // Target is lower in array, move the index halfway down.
                end = index;
            }
            else {
                // Target is higher in array, move the index halfway up.
                start = index + 1;
            }
            
            // Get next mid-point.
            index = Math.floor((end - start) / 2) + start;
        }
    }
    return index;
};