"use strict";

var _react = _interopRequireDefault(require("react"));

var _ink = require("ink");

var _propTypes = _interopRequireDefault(require("prop-types"));

var _gradientString = _interopRequireDefault(require("gradient-string"));

var _stripAnsi = _interopRequireDefault(require("strip-ansi"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Gradient = props => {
  if (props.name && props.colors) {
    throw new Error('The `name` and `colors` props are mutually exclusive');
  }

  const gradient = props.name ? _gradientString.default[props.name] : (0, _gradientString.default)(props.colors);

  const applyGradient = text => gradient.multiline((0, _stripAnsi.default)(text));

  return /*#__PURE__*/_react.default.createElement(_ink.Transform, {
    transform: applyGradient
  }, props.children);
};

Gradient.propTypes = {
  children: _propTypes.default.oneOfType([_propTypes.default.arrayOf(_propTypes.default.node), _propTypes.default.node]).isRequired,
  name: _propTypes.default.oneOf(['cristal', 'teen', 'mind', 'morning', 'vice', 'passion', 'fruit', 'instagram', 'atlas', 'retro', 'summer', 'pastel', 'rainbow']),
  colors: _propTypes.default.arrayOf(_propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.object]))
};
module.exports = Gradient;
