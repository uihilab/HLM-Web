import HydroLangBMI from "./hydroLangBMI.js";

/**
 * Data module implementation for the Clear Creek HLM case study model
 * Overrides some of the methods implemented in the BMI HydroLang implementation.
 * Extends the HydroLang functional space by inheritance.
 * @class BMIHLData
 * @extends HydroLangBMI
 *
 */

class BMIHLData extends HydroLangBMI {
  /**
   * Constructor for the BMIHLData class. It instatiates the intialize function in the
   * BMIHLData implementation.
   * @constructor
   * @augments HydroLangBMI
   * @param {String} configfile
   */
  constructor(configfile = undefined) {
    super(configfile);
  }

  /**
   * Update the model until a required time,
   * Depending on the module and function required.
   * @augments HydroLangBMI
   * @param {void}
   * @memberof BMIHLData
   */
  update() {
    this.update_until();
  }

  /**
   * Updates a model and function call depending on the requirements
   * of the function and module called.
   * @method update_until
   * @memberof BMIHLData
   * @override
   * @param {Number} time - default time to be updated depending on the model
   * @returns {void} updates the current variable to the required timestep.
   */
  update_until(time = this._now + this._defaultStep) {
    time = Math.min(this._defaultStep, this._endTime);
    //setting current time to
    this._now === 0 ? (this._now = this._startTime) : this._now = this._now + time;
  }

  get_var_location() {}

  /**
   * Returns the current state of the model. For BMIHLData is the default time step.
   * @method get_time_step
   * @memberof BMIHLData
   * @returns {Number} default time step
   */

  get_time_step() {
    return this._defaultStep;
  }

  get_value() {}

  /**
   * Obtains the rainfall values at a specific index in the results array, when an index array is passed.
   * @param {String} var_name - name of the variable used for the calculations
   * @param {Object[]} dest - array destiny required for the results
   * @param {Object[]} indices - array with the values of the links
   * @returns {Object[]} rainfall values perr order of link given.
   * @override
   * @memberof BMIHLData
   */

  get_value_at_indices(var_name, dest, indices) {
    var current = this.get_current_time();
    var timeIndex = super.value_index(current, this.results["dates"]);
    console.log(timeIndex);
    indices.forEach((link) => {
      dest.push(this.results[link][timeIndex]);
    });
    eval(`this._${var_name} = ${dest}`)
    return dest;
  }

  /**********************************/
  /*** Helper functions **/
  /**********************************/

  /**
   * Grabs the downloaded object to create the links object and parse the dates
   * for each link so they can be in unixtime.
   * Overrides the values of the time used depending on the type of unit used
   * @method spreadResults
   * @memberof BMIHLData
   * @returns {VoidFunction} sets the results to be access later by HLM
   */

  spreadResults() {
    this.results = this.results[0];
    this.getLinks();
    var stgDate = [];
    var stgRes = {};
    //Just using the first element to get the dates in unix epoch
    this.links.slice(0, 1).forEach((link) => {
      this.results[link]["dates"].forEach((date) => {
        var parsedDate = new Date(date);
        var stgUnix = parsedDate.getTime() / 1000;
        this._timeUnit == "hr" ? stgUnix / 3600 : stgUnix;
        stgDate.push(stgUnix);
      });
      this.results["dates"] = stgDate;
    });
    this.links.forEach((link) => {
      stgRes[link] = this.results[link]["values"];
    });
    stgRes["dates"] = stgDate;
    this.results = stgRes;
    stgRes = [];
    stgDate = [];
  }

  /**
   * 
   * @returns {Object[]} array with names of the links
   */

  getLinks() {
    this.links = Object.keys(this.results);
    return this.links;
  }

  /**
   * 
   * @param {*} i 
   * @param {*} j 
   * @returns 
   */
  rainID() {
      var ev = this.results.dates
      var events = {}
      for (var i = 0 ; i < ev; i++) {

      }
  }

  /**
   * @method dataStep
   * @memberof 
   * @param {Number} i - initial value
   * @param {Number} j - i + 1 value
   * @returns {Number} difference between the two
   */

  dataStep(i, j) {
      try{return j - i} catch(NaN){return}
  }

  /**********************************/
  /*** End of Helper functions **/
  /**********************************/
}

typeof window !== "undefined" ? (window.BMIHLData = BMIHLData) : null;
export default BMIHLData;
