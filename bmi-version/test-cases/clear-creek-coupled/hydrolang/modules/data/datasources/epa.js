/**
 * Data endpoints for the Hydrologic Micro Services from the EPA. HydroLang supports the requests through
 * AJAX calls to the server.
 * https://qed.epa.gov/hms/meteorology/precipitation/data_request/
 * @type {Object}
 * @memberof datasources
 */

 export default {
    //returns all the links in a 

    "precipitation": {
      endpoint: "https://qed.epa.gov/hms/rest/api/meteorology/precipitation",
      //example of request for the precipitation endpoint.
      params: {
        "source": null,
        "dateTimeSpan": {
          "startDate": null,
          "endDate": null,
          "dateTimeFormat": "yyyy-MM-dd HH"
        },
        "geometry": {
          "hucID": null,
          "stationID": null,
          "point": {
            "latitude": null,
            "longitude": null,
          },
          "geometryMetadata": null,
          "timezone": null
        },
        "dataValueFormat": "E3",
        "temporalResolution": "default",
        "timeLocalized": false,
        "units": "metric",
        "outputFormat": "null",
        "baseURL": null,
        "inputTimeSeries": null
      },
    },
  
    headers: {
    "accept" : "*/*",
    "content-type": "application/json; charset=utf-8",
    },
    
    //set of requirements from the source. If different methods for dat retrieval can be used, then "GET" is default.
    requirements: {
      needProxy: true,
      requireskey: false,
      specialHeaders: true,
      method: "POST",
    },
  };
  