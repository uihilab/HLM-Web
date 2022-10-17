/**
 * Dta specific for the development of a case study for the implementation of
 * BMI.js standard. This application has been developed and deployed using
 * MRMS-Stage IV data obtained for the IFC HLM model for the Clear Creek
 * in Iowa. 
 * The endpoints available are: 
 * For more information,please visit:
 * https://ifis.iowafloodcenter.org/ifis/sc/modelplus/
 * https://agu.confex.com/agu/fm21/meetingapp.cgi/Paper/897497
 * @type {Object}
 * @memberof datasources
 */

 export default {
    //returns all the links in a 

    "req-data": {
      endpoint: "https://bmi-data-service.herokuapp.com/links/",
      params: {
        link: null,
        startDate: null,
        endDate: null
      },
    },
  
    //set of requirements from the source. If different methods for dat retrieval can be used, then "GET" is default.
    requirements: {
      needProxy: false,
      requireskey: false,
      method: "GET",
    },
  };
  