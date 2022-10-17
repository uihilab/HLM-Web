import HydroLang from "../hydrolang/hydro.js";

/**
 * Provides the hydro instance from HydroLang.js and other variables for usage.
 * @namespace Hydro
 * @property {function} hydro -  HydroLang instance kept live under the namespace.
 */
var Hydro =
  Hydro ||
  (function () {
    var hydro = new HydroLang();
    return {
      /**
       * @method ins
       * @memberof Hydro
       * @returns {Object} HydroLang instance
       */
      ins: function () {
        return hydro;
      },
    };
  })();

  
export { Hydro };
