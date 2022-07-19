"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_1 = require("react");
const ink_1 = require("ink");
const spinners = require("cli-spinners");
/**
 * Spinner.
 */
const Spinner = ({ type = 'dots' }) => {
    const [frame, setFrame] = react_1.useState(0);
    const spinner = spinners[type];
    react_1.useEffect(() => {
        const timer = setInterval(() => {
            setFrame(previousFrame => {
                const isLastFrame = previousFrame === spinner.frames.length - 1;
                return isLastFrame ? 0 : previousFrame + 1;
            });
        }, spinner.interval);
        return () => {
            clearInterval(timer);
        };
    }, [spinner]);
    return React.createElement(ink_1.Text, null, spinner.frames[frame]);
};
exports.default = Spinner;
