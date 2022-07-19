"use strict";
const react_1 = require("react");
const ink_1 = require("ink");
function useStdoutDimensions() {
    const { stdout } = ink_1.useStdout();
    const [dimensions, setDimensions] = react_1.useState([stdout.columns, stdout.rows]);
    react_1.useEffect(() => {
        const handler = () => setDimensions([stdout.columns, stdout.rows]);
        stdout.on('resize', handler);
        return () => {
            stdout.off('resize', handler);
        };
    }, [stdout]);
    return dimensions;
}
module.exports = useStdoutDimensions;
