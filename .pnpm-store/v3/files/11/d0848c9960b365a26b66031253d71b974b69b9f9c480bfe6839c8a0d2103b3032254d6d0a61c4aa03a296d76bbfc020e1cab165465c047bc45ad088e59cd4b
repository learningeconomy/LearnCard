import React, { Fragment, useState } from 'react';
import { styled, themes, convert } from '@storybook/theming';
import { Icons } from '@storybook/components';
const ListWrapper = styled.ul({
  listStyle: 'none',
  fontSize: 14,
  padding: 0,
  margin: 0
});
const Wrapper = styled.div({
  display: 'flex',
  width: '100%',
  borderBottom: `1px solid ${convert(themes.normal).appBorderColor}`,
  '&:hover': {
    background: convert(themes.normal).background.hoverable
  }
});
const Icon = styled(Icons)({
  height: 10,
  width: 10,
  minWidth: 10,
  color: convert(themes.normal).color.mediumdark,
  marginRight: 10,
  transition: 'transform 0.1s ease-in-out',
  alignSelf: 'center',
  display: 'inline-flex'
});
const HeaderBar = styled.div({
  padding: convert(themes.normal).layoutMargin,
  paddingLeft: convert(themes.normal).layoutMargin - 3,
  background: 'none',
  color: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  borderLeft: '3px solid transparent',
  width: '100%',
  '&:focus': {
    outline: '0 none',
    borderLeft: `3px solid ${convert(themes.normal).color.secondary}`
  }
});
const Description = styled.div({
  padding: convert(themes.normal).layoutMargin,
  marginBottom: convert(themes.normal).layoutMargin,
  fontStyle: 'italic'
});
export const ListItem = ({
  item
}) => {
  const [open, onToggle] = useState(false);
  return /*#__PURE__*/React.createElement(Fragment, null, /*#__PURE__*/React.createElement(Wrapper, null, /*#__PURE__*/React.createElement(HeaderBar, {
    onClick: () => onToggle(!open),
    role: "button"
  }, /*#__PURE__*/React.createElement(Icon, {
    icon: "chevrondown",
    color: convert(themes.normal).appBorderColor,
    style: {
      transform: `rotate(${open ? 0 : -90}deg)`
    }
  }), item.title)), open ? /*#__PURE__*/React.createElement(Description, null, item.description) : null);
};
export const List = ({
  items
}) => /*#__PURE__*/React.createElement(ListWrapper, null, items.map(item => /*#__PURE__*/React.createElement(ListItem, {
  key: item.title + item.description,
  item: item
})));