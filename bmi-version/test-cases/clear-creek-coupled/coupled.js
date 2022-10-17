function instantiateModels(){
    // instantiate models with the config files.
    // brute force for now.
    model = new HLM('gbl-cc.json');
    pMod = new BMIHLData('bmi-implementation/config.json');
}

function checkSimulations(){
    // Initial check to see if both models
    // have the same start time
    if (pMod.get_current_time()*1000 != model.get_current_time().getTime()){
        console.log("precip mod time: " + pMod.get_current_time()*1000);
        console.log("HLM model time: " + model.get_current_time().getTime());
        throw Error("Models not on same start time.");
    }

    // Check if both models have the same time step
    if (pMod.get_time_step() != model.get_time_step()){
        console.log("precip mod time step: " + pMod.get_time_step());
        console.log("HLM model time step: " + model.get_time_step());
        throw Error("Models with unequal time steps");
    }

    // Missing Checks
    // Perform some checks to confirm equivalency
    // 1. [done] start times equivalent
    // 2. [done] default time step is the same, if not set to be equal
    // 4. have same link ids, make sure the grid is aligned
    // 5. Confirm that pMod output variable (and units) is same as HLM input (and units)
    // 6. Confirm other variables to link the models' output --> input
}

function coupledSimulation(){
    console.log("starting simulation...");

    var precipVals;
    var linkOrder = model.network.order;

    // for now, need to spread the results
    // and update pMod from t=0 unix to t=start of sim
    pMod.spreadResults();
    pMod.update();

    // Check whether everything is set up correctly
    checkSimulations(); // throws an error if something is wrong.

    // Loop, pass value, and step together.
    while (model.get_current_time() < model._endDt){
        precipVals = pMod.get_value_at_indices('nothing__here',[],linkOrder);
        model.set_value_at_indices("atmosphere_water__rainfall_volume_flux",[...linkOrder],[...precipVals]);

        model.update(); 
        console.log("HLM updated to: " + model.get_current_time().getTime());

        pMod.update(); 
        console.log("Data model updated to: " + pMod.get_current_time());
    }
}