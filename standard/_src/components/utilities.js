// test case functionality 
function runDynamicSimulation(){
    /*
    Loop once through all links.
    Solve to end for each before moving on.
    */

    GBL.params = setSolverLimsAndInitialConditions(GBL.model);

    var started = new Date();
    links = makeDynamicLinks();

    delete prm; delete stormTS;

    // could define order this way.
    // order is currently provided in prm-*.js file
    // var linksToStep = getOrder();
    var l;
    for (l = 0; l < linksToStep.length; l++) {
        if (links[linksToStep[l]].hstep === undefined){
            // calculate optimal first step
            links[linksToStep[l]].firstStep();
        }

        links[linksToStep[l]].step(end); // go to end

        // "Garbage Collection"
        let p;
        for (p = 0; p < links[linksToStep[l]].parents.length; p++) {
            if (!GBL.keep.includes(links[linksToStep[l]].parents[p])){
                links[links[linksToStep[l]].parents[p]] = undefined;
            }
        }
    }

    var simTime = (new Date() - started)/1000;

    document.getElementById('progress').innerHTML = "<p class=\"directions\"><b>Done!</b> Total Time: <b>" + simTime.toPrecision(3) + '</b> seconds</p>';
}

function makeDataTable(){
    // after simulation:
    // make a google DataTable with results and benchmark data

    if (typeof(google.loaded) === "undefined"){
        // visualize results for link of ids
        google.charts.load('current', {packages: ['corechart', 'line']});
        google.loaded = true;
    }

    google.charts.setOnLoadCallback(populateTable);

    function populateTable(){
        var interval = 5; // [min] intervals between plotted points
        interval = interval * 60; // [seconds]

        simData = new google.visualization.DataTable();
        simData.addColumn('number','Time');
        simData.addColumn('number','Benchmark');
        simData.addColumn('number','Results');

        rows = [];
        for (i in HPClink["time"]){
            row = [HPClink['time'][i]/60, HPClink['Flow'][i], links[GBL.keep[0]].getY(HPClink['time'][i]*60,0)]
            rows.push(row);
        }
        simData.addRows(rows);
    }
}

    function showHydrograph(){
    if (typeof(google.loaded) === "undefined"){
        // visualize results for link of ids
        google.charts.load('current', {packages: ['corechart', 'line']});
        google.loaded = true;
    }

    google.charts.setOnLoadCallback(drawLinkHydrograph);

    function drawLinkHydrograph(){
        dataView = new google.visualization.DataView(simData);

        var options = {
            // title: 'Hydrograph for Link ID:' + linkName,
            chart: {},
            legend:{position:'left'},
            hAxis: {
              title: 'Time [hours]',
              viewWindowMode: 'explicit',
              viewWindow: {
                min: 0,
                max: end/3600
              },
              titleTextStyle : {fontSize: 20}
            },
            vAxis:{
                title:'Discharge [m^3 s^-1]',
                viewWindow:{min:0},
                titleTextStyle : {fontSize: 20}
            },
            
            width:'80%',
            height:'70%'
        };

        var chart = new google.charts.Line(document.getElementById('chartJunk'));
        chart.draw(dataView,google.charts.Line.convertOptions(options));
    }
}


// Utility Functions for simulation
var searchInsert = function(nums, target) {
	// Author: Primary Objects
	// https://gist.github.com/primaryobjects
	// Source:
	// https://gist.github.com/primaryobjects/117017f85769124c28c858f8735f27d8
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
                // Found our target.
                result = index;
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

// Currently unused. 
function getOrder(){
    // prm is a list of lists where:
    // inner[0] - link id
    // inner[1] - total contributing area

    // do once:
    //  sort or of inner lists on inner[1]
    //  make list of inner[0]s
    
    // Note: this is not the depth first search, post-order 
    // algo mentioned in the paper. This is more naive.
    // post-order algo is implemented in python.

    var i;

    var order = new Int32Array(prm.length);
    prm.sort(function(a,b){return a[1] - b[1];});

    for (i in prm){
        order[i] = prm[i][0];
    }

    return order;
}