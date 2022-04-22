## Clear Creak test case usage:
```JavaScript
var model = new HLM('gbl-cc.json');

// steps default timestep (in this case one hour)
model.update(); 

// steps to end of day 1 of simulation
model.update_until(24*3600); 
```


**Note**: This is a different parameterization of the Clear Creek watershed than the other test case.
