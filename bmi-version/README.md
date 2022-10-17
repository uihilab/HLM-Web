# General Overview
This subdir is contains the BMI-compliant implementation of HLM-Web.

## Usage

To include and use this BMI-compliant HLM-Web, e.g., load the resource into an HTML page, include the `shell.js` file from the `_src` subdir.

```HTML
<head>
  <script src="{path_to}/_src/shell.js"></script>
</head>
```

From `shell.js`, the `BMI` resource is first loaded (see below.) Upon load of the `BMI` package, the BMI-compliant HLM-Web version is loaded.

```JavaScript
/**
shell.js
Chained import of first BMI package then HLM 
*/
import('./bmi.js').then(
    (BMI) => {
        window.BMI = BMI.default;
    }
    ).then( () => {
        import('./hlmweb-bmi.js').then(
            (HLM) => {
                window.HLM = HLM.default;
                window.searchInsert = HLM.searchInsert;
            }
        )
    });
```

Once the resource is successfully loaded the user can then call the package to instantiate an instance of an HLM-Web model. BMI calls can then be made on this HLM model object. A simple example its use can be found below. Here, a `HLM` model object is first instantiated (by provding configuration information in json file,) and then updated one timestep of the model.

```JavaScript
// instantiate new HLM model object
var model = new HLM('gbl-test.json');

// steps to default timestep.
// Default step can be altered from config json.
model.update();
```

## Example implementations
We encourage you to look the two example implementations located in the `test-cases` subdir.

**`test`**: Is 
