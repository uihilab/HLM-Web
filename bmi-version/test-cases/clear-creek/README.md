# Test Case: Variable Runoff Model

This test case is for the Variable Runoff Model.
It is similar to that of the [standard variable runoff model](https://github.com/uihilab/HLM-Web/tree/master/standard/test-cases/clear-creek) test case, but not exactly the same.
(The reason for this is that the BMI version uses an updated version of the network topology... just means the input data for the grid/hydrofabric is different.)

## Usage
1. To start, load `index.html` in your browser.
2. Open the console.
3. Make a new HLM model instance with the `gbl-test.json` config file, e.g., `var model = new HLM('gbl-cc.json');`

At this point, an HLM model instance is fully loaded into the browser environment.
From here, any of the BMI functions will be available for use.
Such as the following:

```JavaScript
model.update() // advances model one default time step.
model.update(7200) // advances model 7200 seconds (i.e., 2 hours.)


// gets the channel discharge for all links and puts the values in foo
var foo = [];
model.get_value("channel_water_x-section__volume_flow_rate",foo);

// Set precipitation rate of 25.5 mm/hr at link id 1033
model.set_value_at_indices("atmosphere_water__rainfall_volume_flux",[1033],[25.5]);
```

To advance the model to the end of the simulation time, write:

```JavaScript
model.update_until(model._end);
```

## Output Data
Each link in the HLM model has an `.output` property.
Everytime the model is updated, output results will be added to this property.
Thus, at any time you can check the results by writing:

```JavaScript
model.links[<linkID>].output
```
