/**
 * https://ifis.iowafloodcenter.org/ifis/ws/
 * This API returns data from the IFIS web service.
 * @type {Object}
 * @memberof datasources
 */

export default {
  //Available data stream from selected locations in Iowa.
  "stream-data": {
    endpoint: "http://ifis.iowafloodcenter.org/ifis/ws/sites.php?",
    params: {
      // These are only written to aid users to know
      // what parameters are available
      site: null,
      period: null,
      format: null,
    },
  },

  //Sensor water elevation.
  "sensor-elevation": {
    endpoint: "http://ifis.iowafloodcenter.org/ifis/ws/elev_sites.php?",
    params: {
      // These are only written to aid users to know
      // what parameters are available
      site: null,
      period: null,
      format: null,
    },
  },

  //Soil moisture data on rain gauges.
  "soil-moisture": {
    endpoint: "http://ifis.iowafloodcenter.org/ifis/ws/elev_sites.php?",
    params: {
      // These are only written to aid users to know
      // what parameters are available
      site: null,
      period: null,
      format: null,
    },
  },

  requirements: {
    needProxy: true,
    requireskey: false,
    method: "GET",
  },
};
