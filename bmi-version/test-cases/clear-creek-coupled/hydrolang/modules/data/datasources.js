/**
 * Extends the data sources on the framework to the data module.
 * @module datasources
 * @extends usgs
 * @extends fema
 * @extends noaa
 * @extends worldbank
 * @extends meteostat
 * @extends aemet
 * @extends eauk
 * @extends meteoit
 * @extends ifis
 */

import usgs from "./datasources/usgs.js";
import fema from "./datasources/fema.js";
import noaa from "./datasources/noaa.js";
import worldbank from "./datasources/worldbank.js";
import meteostat from "./datasources/meteostat.js";
import aemet from "./datasources/aemet.js";
import eauk from "./datasources/eauk.js";
import meteoit from "./datasources/meteoit.js";
import ifis from "./datasources/ifis.js";
import clearcreek from "./datasources/clearcreek.js"
import epa from "./datasources/epa.js"

export { usgs, fema, noaa, worldbank, meteostat, aemet, eauk, meteoit, ifis, clearcreek, epa};
