# Jet-Logger

> A super quick, easy to setup logging tool for NodeJS/TypeScript.


## What is it
Jet-Logger is an easy to configure logging tool that allows you change settings via the environment
variables (recommended) or manually in code. You can easily switch your logs to be printed out to the command line, a file, sent through your own custom logging logic, or turned off completely. Logs printed to the console also are printed out in different colors depending on whether they're info, a warning, an error, etc. The file for holding logs can be specified manually or left as the default. You can also have
logs formatted as lines for easy reading or as JSON objects.
<br/>

### Installation
```batch
$ npm install --save jet-logger
```

### Guide
The logger package's main export is the `logger` object. Logger can used statically or as an instance 
object with settings configured through a constructor. Variables passed through the constructor will
take priority over environment variables. Note that file writes happen asynchronously. 

- The four environment variables are:
    - `JET_LOGGER_MODE`: can be `'CONSOLE'`(default), `'FILE'`, `'CUSTOM'`, and `'OFF'`.
    - `JET_LOGGER_FILEPATH`: the file-path for file mode. Default is _home_dir/jet-logger.log_.
    - `JET_LOGGER_TIMESTAMP`: adds a timestamp next to each log. Can be `'TRUE'` (default) or `'FALSE'`.
    - `JET_LOGGER_FORMAT`: formats log as a line or JSON object. Can be `'LINE'` (default) or `'JSON'`.

_logger_ has an export `LoggerModes` which is an enum that provides all the modes if you want to
use them in code. I would recommend using `Console` for local development, `File` for remote development, 
and `Custom` or `Off` for production. If you want to change the settings in code, you can do so via importing the `JetLogger` function and calling it with whatever options you want.
<br>

- There are 4 functions on Logger to print logs.
    - `info`: prints green.
    - `imp`: prints magenta. 
    - `warn`: prints yellow.
    - `err`: prints red.

There is an optional second param to each method which is a `boolean`. If you pass `true` as the second 
param, JetLogger will use node's `util` so that the full object gets printed. You should NOT normally 
use this param, but it is especially useful when debugging errors so that you can print out the full 
error object and observe the stack trace.<br>

Let's look at some sample code in an express route:

````typescript
/* Some script that is run before the route script */

// Apply logger settings (Note you could also using a tool "dotenv" to set env variables)
// These must be set before logger is imported
const logFilePath = path.join(__dirname, '../sampleProject.log');
process.env.JET_LOGGER_MODE = LoggerModes.File; // Can also be Console, Custom, or Off
process.env.JET_LOGGER_FILEPATH = logFilePath;


/* In you route script */

import { OK } from 'http-status-codes';
import { Router, Request, Response } from 'express';
import logger from 'jet-logger';

const router = Router();


router.get('api/users/alt', async (req: Request, res: Reponse) => {
    logger.info(req.params.msg);
    logger.imp(req.params.msg);
    logger.warn(req.params.msg);
    logger.err(req.params.msg);
    logger.err(new Error('printing out an error'));
    logger.err(new Error('printing out an error full'), true);  // <-- print the full Error object
    return res.status(OK).json({
        message: 'console_mode',
    });
});
````


- The previous code-snippet will  show the following content when printed:
````
[2020-10-11T04:50:59.339Z] INFO: hello jet-logger
[2020-10-11T04:50:59.341Z] IMPORTANT: hello jet-logger
[2020-10-11T04:50:59.341Z] WARNING: hello jet-logger
[2020-10-11T04:50:59.342Z] ERROR: hello jet-logger
[2020-10-11T04:50:59.372Z] ERROR: Error: Demo print full error object
    at Object.<anonymous> (C:\Projects\jet-logger\sample-project\src\index.ts:21:12)
    at Module._compile (internal/modules/cjs/loader.js:956:30)
    at Module.m._compile (C:\Users\seanp\AppData\Roaming\npm\node_modules\ts-node\src\index.ts:536:23)
    at Module._extensions..js (internal/modules/cjs/loader.js:973:10)
    at Object.require.extensions.<computed> [as .ts] (C:\Users\seanp\AppData\Roaming\npm\node_modules\ts-node\src\index.ts:539:12)
    at Module.load (internal/modules/cjs/loader.js:812:32)
    at Function.Module._load (internal/modules/cjs/loader.js:724:14)
    at Function.Module.runMain (internal/modules/cjs/loader.js:1025:10)
    at main (C:\Users\seanp\AppData\Roaming\npm\node_modules\ts-node\src\bin.ts:212:14)
    at Object.<anonymous> (C:\Users\seanp\AppData\Roaming\npm\node_modules\ts-node\src\bin.ts:470:3)
````


### Using a custom logger 
For production you'll probably have some third party logging tool like ElasticSearch or Splunk. _logger_ exports a type `TCustomLogger` that needs to implemented. If you implement this function and pass it to JetLogger and set the mode to `CUSTOM`, Logger will call whatever logic you created for `sendLog()`.


````typescript
// In the route file
import { OK } from 'http-status-codes';
import { Router, Request, Response } from 'express';
import { JetLogger, ICustomLogger } from 'jet-logger';
import { thirdPartyLoggingApp } from 'thirdPartyLoggingApplicationLib';


// Needs to be implemented
const customSend: TCustomLogger = (timestamp: Date, level: string, content: any) => {
    thirdPartyLoggingApp.doStuff(...);
}

router.get('api/users', async (req: Request, res: Reponse) => {
    const logger = JetLogger(LoggerModes.CUSTOM, '', true, customSend);
    logger.rmTimestamp = true;
    logger.info(req.params.msg);
    return res.status(OK).json({
        message: 'console_mode',
    });
});
````
