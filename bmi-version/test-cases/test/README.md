## Test usage:
```JavaScript
var model = new HLM('gbl-test.json');

// steps default timestep (in this case one hour)
model.update(); 

// steps to end of day 1 of simulation
model.update_until(24*3600); 
```
