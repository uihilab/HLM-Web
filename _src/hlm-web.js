/*
Title: HLM-Web, source package
Author: Gregory Ewing
Date: January 2022

About: HLM-Web is a JavaScript package to perform rainfall-
runoff modelling. As its base, it uses the Hillslope Link
Model formulation.

This file contains a function to add the required scripts to
the header of an html file, and the subsequent parts required
to perform simulations.
*/

function addScriptToHead(srcLink, callback){
    var head = document.getElementsByTagName("head")[0];
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = srcLink;
    script.onload = callback;
    head.appendChild(script);
};

/*
This file primarily contains the definition of the class
for the dynamicLink object. This object is the model
object for the hillslope link, and is the primary unit
in which the simulation and calculations take place.
*/
addScriptToHead("../../_src/components/dynamicLink.js");

/*
This file contains the numerical solver routines.
Current solver is The Runge-Kutta 4th Order.
*/
addScriptToHead("../../_src/components/solvers.js");

/*
This file contains the mathematical models which
describe the physical processes of runoff generation
on the hillslope surface and the streamflow routing
within the channel links.
*/
addScriptToHead("../../_src/components/models.js");

/*
This file contains miscellaneous functions which are
used in the functionality of the test case pages as well
as functions used in the simulations.
*/
addScriptToHead("../../_src/components/utilities.js");