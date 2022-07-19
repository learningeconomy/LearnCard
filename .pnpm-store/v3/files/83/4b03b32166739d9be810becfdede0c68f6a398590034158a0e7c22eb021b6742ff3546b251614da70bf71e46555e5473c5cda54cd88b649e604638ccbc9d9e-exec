#!/usr/bin/env node

console.log(process.cwd());
let toless = require("./jsonToLESS.js");
let tojs = require("./jsonToCLASS_.js");
let emitcss = require("./cssToJS.js");
let exec = require("child_process").exec;

// 1. Create ./dist/temp.css (temporary, non-compressed)
toless("./dev/style.json", "./temp.less");
console.log("complete: create ./temp.less");
exec("cat ./temp.less ./dev/apg-lib.less > ./temp-cat.less", (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: cat ./temp.less ./apg-lib.less > ./temp-cat.less: ${error}`);
        return;
    }
    console.log("complete 1.: composite LESS file created, ./temp-cat.less");
    
    // 2. LESS to create the css file
    exec("lessc ./temp-cat.less ./temp.css", (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: lessc ./temp-cat.less ./temp.css: ${error}`);
            return;
        }
        console.log("complete 2.: create the uncompressed css file, temp.css");

        // 3. Create ./src/emitcss.js
        emitcss("./temp.css", "./src/apg-lib/emitcss.js");
        console.log("complete 3.: css file generates emitcss.js");

        // 4. Create ./src/style.js
        tojs(".//dev/style.json", "./src/apg-lib/style.js");
        console.log("complete 4.: generate the style.js file");

        // 5. compress css -> apg-lib-bundle.css
        exec("minify ./temp.css > ./dist/apg-lib-bundle.css", (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: minify ./temp.css > ../dist/apg-lib-bundle.css: ${error}`);
                return;
            }
            console.log("complete 5.: compress the css file");
            
            // 6. delete temporary files
            exec("rm ./temp.less && rm ./temp-cat.less && rm ./temp.css", (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: rm ./temp.less && rm ./temp-cat.less && rm ./temp.css: ${error}`);
                    return;
                }
                console.log("complete 6.: delete temporary files");
            });
        });
    });
});

return;
