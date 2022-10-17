
var targetVar = "atmosphere_water__rainfall_volume_flux";
var model = new HLM('gbl-cc.json');
var data = new BMIHLData('bmi-implementation/epatrial.json');


data.additionalData();
data.retrieveEpaData();


data.spreadResults();
data.update();data.upate();
model.upate();
checkSimulations(data,model);

function oneStep(){
    vals = data.get_value_at_indices(variable,[],linkOrder);
    model.set_value_at_indices(variable,[...linkOrder],[...vals]);
    model.update();
    console.log("model time: " + model.get_current_time().getTime());
    data.update();
    console.log("data time: " + data.get_current_time());
}

