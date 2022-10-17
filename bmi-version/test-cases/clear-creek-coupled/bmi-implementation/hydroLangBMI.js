import BMI from "./bmi.js";
import { Hydro } from "./globalHydro.js";
import BMIConfig from "./bmiConfig.js";

//Calling the HydroLang instance from previously defined namespace
const hydro = Hydro.ins();
const config = new BMIConfig()

/**
 * BMI implementation of the functions of HydroLang.js
 * Creates and updates forcings and data following the models from configuration files
 * and makes calls from other modules.
 * @class BMI
 */
class HydroLangBMI extends BMI{
    /**
     * Constructor instance for the HydroLang BMI implementation. 
     * If no link is added into the configuration, then an error will be raised.
     * All instances of HydroLang will be accessible through the BMI configuration
     * file.
     * @param {String} configfile 
     */
    constructor(configfile=undefined) {
        super()
        if(!configfile || configfile == undefined){
            throw Error("BMI_FAILURE: Cannot initialize library. Please provide configuration file!")
        } else{
            this.initialize(configfile);
        }
    }

     initialize(configfile=undefined){
        if(configfile){
                fetch(configfile).then(res => res.json()).then(data =>{
                    console.log(data)
                    this._modelName = data['modelName'];
                    this._componentName = data['componentName']
                    this._moduleName = data['moduleName'];
                    this._modelCode = data['modelCode'];
                    this._functionName = data['functionName'];
                    this._args = data['args'];
                    this._params = data['params'];

                    //Defining the default step to be 1 unit in case there is nothing passed as a parameter
                    //Time stamp parameter still dealt with in unixtime to avoid further confusion down the line
                    (!data['duration']['defaultStep']) ?
                    this._defaultStep = 1 * 3600 : this._defaultStep = data['duration']['defaultStep'] * 3600;

                    //Defining the default units for the time

                    //Possibilities in time types: s, min, h, d
                    (!data['duration']['timeUnit']) ?
                    this._timeUnit = 'h' : this._timeUnit = data['duration']['timeUnit'];

                    //Time parameters
                    //Assuming the required data to be used for simulations are the same as the API calls. If not, a time parameter must be specified.
                    (!data['duration']['startTime']) ? (() => 
                    {
                        var stageDate = new Date(this._args['startDate'])
                        var stgUnix = stageDate.getTime() / 1000
                        this._timeUnit === 'hr' ?  stgUnix / 1000 : stgUnix
                        return this._startTime = stgUnix})()
                        : 
                        this._startTime = data['duration']['startTime'];
                    (!data['duration']['endTime']) ? (() =>{
                        var stageDate = new Date(this._args['endDate'])
                        var stgUnix = stageDate.getTime() / 1000
                        this._timeUnit === 'hr' ?  stgUnix / 1000 : stgUnix
                        return this._endTime = stgUnix
                    })()
                     : this._endTime = data['duration']['endTime'];

                    this._inputVars = data['inputVars'];
                    this._outputVars = data['outputVars'];
                    this._now = 0

                    this._inputUnits = data['units']['input'];
                    this._outputUnits = data['units']['output']
                    this.handleConfig()
                })
            }
    }

    /**
     * Update the model until a required time,
     * Depending on the module and function required.
     * @param {void}
     */    
     update(){
        this.update_until()
    }

    /**
     * Updates a model and function call depending on the requirements
     * of the function and module called.
     * @method update_until
     * @memberof HydroLangBMI
     * @param {Number} time - default time to be updated depending on the model 
     * @returns {void} updates the current variable to the required timestep.
     */
     update_until(time = this._now + this._defaultStep){
        var finalUpate = Math.min(this._endDate, time)
        this._now = finalUpate
        return this.now
    }

    /**
     * Finalizes a module
     * STILL REQUIRING MEMORY DUMP!
     * @method finalize
     * @memberof HydroLangBMI
     * @returns alert about model simulation being finalized.
     */

     finalize(){
         for (const prop of Object.getOwnPropertyNames(this)){
             delete this[prop]
         }
        return alert('Model has finished')
    }

    /**
     * Gives back a model name defined by the configuration file
     * @method get_component_name
     * @memberof HydroLangBMI
     * @param {void}
     * @returns {String} model and modelcode as a full name
     */

     get_component_name(){
        return (`${this._modelName} - ${this._modelCode}`)
    }

    /**
     * Lets other models see the available variables included within the model
     * @method get_input_name_count
     * @param {void}
     * @return {Object} array with names as strings
     * 
     */

     get_input_name_count(){
        return Object.keys(this._inputVars).length;
    }

    /**
     * Lets other models see the number of available variables as outputs from this model
     * @method get_output_count
     * @memberof hydroLangBMI
     * @returns {Number} Number of output variables
     * 
     */

     get_output_count(){
         return this._outputVars.length
     }

     /**
      * Returns the names of the variables used as inputs for this model
      * @method get_input_var_names
      * @memberof hydroLangBMI
      * @returns {Object[]} Array with strings of input variable names
      */

     get_input_var_names(){
         return this._inputVars
     }

     
     /**
      * Returns the names of the variables used as outputs for this model
      * @method get_ouput_var_names
      * @memberof hydroLangBMI
      * @returns {Object[]} Array with strings of input variable names
      */

      get_output_var_names(){
        return this._outputVars
    }

     /**
      * Returns the id for the grid used in a model for a specific variable.
      * HydroLang does not used a grid system. If implemented, uses 1 single location at '0' index.
      * @method get_var_grid
      * @memberof hydroLangBMI
      * @returns {Number} Grid identifier.
      */

     get_var_grid(){
         return 0;
     }

     /**
      * 
      * @param {String} name - input or output variable name, a CSDMS Standard Name 
      * @returns {String} Variable nme depending on the type of variable.
      */

     get_var_type(varName){
         varName = 0
        return typeof(varName)
    }

    /**
     * 
     * @param {String} var_name 
     * @returns {String} units of the variable in question.
     */

     get_var_units(var_name){
        var unitsIn = this.value_index(var_name, this._inputVars)
        var unitsOut = this.value_index(var_name, this._outputUnits)
        if (unitsIn != 'object') {
            return this._inputUnits[unitsIn]
        };
        if (unitsOut != 'object') {
            return this._outputUnits[unitsOut]
        }
    }

     get_var_itemsize(var_name){
         this.dataTypes[typeof var_name](var_name)
     }

     get_var_nbytes(){

    }

     get_var_location(){}

     /**
      * 
      * @method get_start_time
      * @memberof hydroLangBMI
      * @returns {Number} start time of the simulation as specified by the simulation file
      */
     get_start_time(){
         return this._startTime
    }

    /**
     * @method get_end_time
     * @memberof HydroLangBMI
     * @returns {Number} end time specified.
     */

     get_end_time(){
         return this._endTime
     }

     /**
      * Time units of the model
      * @method get_time_units
      * @memberof HydroLangBMI
      * @returns {String} unit of time. If not specified in config file, the unit used throughout HydroLang is hour
      */

     get_time_units(){
         return this._timeUnit
     }

     /**
      * Returns the current state of the model. For HydroLangBMI is the default time step.
      * @method get_time_step
      * @memberof HydroLangBMI
      * @returns {Number} default time step
      */

     get_time_step(){
         return this._defaultStep
     }

     get_current_time(){
         return this._now
     }

     get_value(){}

    /**
     * 	Get a reference to the values of a given variable.
     * @method get_value_ptr
     * @memberof HydroLangBMI
     * @returns {Error} no implementation for HydroLangBMI/JavaScript.
     */

     get_value_ptr(){
        throw Error('BMI_FAILURE: Not implemented!')
    }

    /**
     * 
     */

     get_value_at_indices(){
         return
     }

     set_value(){}

     set_value_at_indices(){

    }

    /**
     * Get the dimensions of a computational grid.
     * @method get_grid_size
     * @memberof HydroLangBMI
     * @returns {Error} no implementation for HydroLangBMI
     */

     get_grid_rank(){
        throw Error("BMI_FAILURE: Not Implemented!");
    };

    /**
     * Get the dimensions of a computational grid.
     * @method get_grid_size
     * @memberof HydroLangBMI
     * @returns {Error} no implementation for HydroLangBMI
     */

     get_grid_size(){
        throw Error("BMI_FAILURE: Not Implemented!");
    };

    /**
     * Get the spacing between grid nodes.
     * @method get_grid_spacing
     * @memberof HydroLangBMI
     * @returns {Error} no implementation for HydroLangBMI
     */

     get_grid_spacing(){
        throw Error("BMI_FAILURE: Not Implemented!");
    };

    /**
     * Get the origin of a grid.
     * @method get_grid_origin
     * @memberof HydroLangBMI
     * @returns {Error} no implementation for HydroLangBMI
     */

     get_grid_origin(){
        throw Error("BMI_FAILURE: Not Implemented!");
    };

    /**
     * Get the locations of a grid’s nodes in dimension 1.
     * @method get_grid_x
     * @memberof HydroLangBMI
     * @returns {Error} no implementation for HydroLangBMI
     */

     get_grid_x(){
        throw Error("BMI_FAILURE: Not Implemented!");
    };

    /**
     * Get the locations of a grid’s nodes in dimension 2.
     * @method get_grid_y
     * @memberof HydroLangBMI
     * @returns {Error} no implementation for HydroLangBMI
     */
    
     get_grid_y(){
        throw Error("BMI_FAILURE: Not Implemented!");
    };

    /**
     * Get the locations of a grid’s nodes in dimension 3.
     * @method get_grid_z
     * @memberof HydroLangBMI
     * @returns {Error} no implementation for HydroLangBMI
     */

     get_grid_z(){
        throw Error("BMI_FAILURE: Not Implemented!");
    };

    /**
     * Get the number of nodes in the grid.
     * @method get_grid_node_count
     * @memberof HydroLangBMI
     * @returns {Error} no implementation for HydroLangBMI
     */

     get_grid_node_count(){
        throw Error("BMI_FAILURE: Not Implemented!");
    };

    /**
     * Get the number of edges in the grid.
     * @method get_grid_edge_count
     * @memberof HydroLangBMI
     * @returns {Error} no implementation for HydroLangBMI
     */

     get_grid_edge_count(){
        throw Error("BMI_FAILURE: Not Implemented!");
    };

    /**
     * Get the number of faces in the grid.
     * @method get_grid_face_count
     * @memberof HydroLangBMI
     * @returns {Error} no implementation for HydroLangBMI
     */

     get_grid_face_count(){
        throw Error("BMI_FAILURE: Not Implemented!");
    };

    /**
     * Get the edge-node connectivity.
     * @method get_grid_edge_nodes
     * @memberof HydroLangBMI
     * @returns {Error} no implementation for HydroLangBMI
     */

     get_grid_edge_nodes(){
        throw Error("BMI_FAILURE: Not Implemented!");
    };

    /**
     * Returns the face-edge connectivity.
     * @method get_grid_face_nodes
     * @memberof HydroLangBMI
     * @returns {Error} no implementation for HydroLangBMI
     */

     get_grid_face_edges(){
        throw Error("BMI_FAILURE: Not Implemented!");
    };

    /**
     * Returns the face-node connectivity for a grid.
     * @method get_grid_face_nodes
     * @memberof HydroLangBMI
     * @returns {Error} no implementation for HydroLangBMI
     */

     get_grid_face_nodes(){
        throw Error("BMI_FAILURE: Not Implemented!");
    };

    /**
     * Returns the number of nodes per face of grid.
     * @method get_grid_nodes_per_face
     * @memberof HydroLangBMI
     * @returns {Error} no implementation for HydroLangBMI
     */

     get_grid_nodes_per_face(){
        throw Error("BMI_FAILURE: Not Implemented!");
    };

    /**********************************/
    /*** Helper functions **/
    /**********************************/

    /**
     * Configuration object that creates a result based on the passed configurations to the HydroLang instance requirement.
     * It saves any results on a result variable that is attached into the class after its called. The method runs
     * once the HydroLangBMI class is called.
     * @method handleConfig
     * @memberof HydroLangBMI
     * @returns {void} - creates a result variable attached to the class.
     */

    async handleConfig(){
        (!this._componentName === null || this._componentName == undefined) ?
        this.results = await hydro[this._moduleName][this._functionName]({args: this._args, params: this._params, data: this._inputVars})
        :
        this.results = await hydro[this._moduleName][this._componentName][this._functionName]({args: this._args, params: this._params, data: this._inputVars})
}

    /**
     * @method var_index
     * @returns {Number} index location of variable in array
     * Retrieves the index of variables in any specific array
     * 
     */

    value_index(value, searchArray){
        var res
        (searchArray.indexOf(value) != -1 || searchArray.indexOf(value) != undefined) ?
        res = searchArray.indexOf(value) : res = Error('No variable with that naming found in the given array.')
        return res
    }

    /**
     * @method visualizer
     * @param {String} type - either column or line chart
     * @param {Object[]} data - n-d array containing the data to render
     * @returns {Object} creates a div on screen that renders the graph using HydroLang's visualize module.
     */

    async visualizer(type, data){
        await hydro['visualize']['draw']({
            params: {type: 'chart', name: this._modelName},
            args: {charttype: type},
            data: data
        })        
    }

    /**
     * @method generateOutputs
     * @returns {Object} creates a memory reporter for all the values and actions taken for the model run
     */

    generateOutputs(data) {
        var outputData = {}
        //Data manipulation for downloading and stuff
        config.configGen(outputData)
    }

    /**
     * @method dataTypes
     */

    dataTypes = {
        "undefined": () => 0,
        "boolean": () => 4,
        "number": () => 8,
        "string": item => 2 * item.length,
        "object": item  => {
            let str = JSON.stringify(item);
            const bytes = new TextEncoder().encode(str).length;
            return bytes
        }
    }

    /**********************************/
    /*** End of Helper functions **/
    /**********************************/
}
(typeof window !== "undefined") ? window.HydroLangBMI = HydroLangBMI : null

export default HydroLangBMI