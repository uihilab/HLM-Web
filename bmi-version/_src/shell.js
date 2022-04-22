/** Chained import of first BMI package then HLM */
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