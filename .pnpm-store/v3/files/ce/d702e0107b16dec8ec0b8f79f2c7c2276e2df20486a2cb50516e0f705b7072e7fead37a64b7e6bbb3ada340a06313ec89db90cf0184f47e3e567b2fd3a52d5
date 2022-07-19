# ink-use-stdout-dimensions

> React hook for subscribing to stdout dimensions in [Ink](https://github.com/vadimdemedes/ink)

## Install

```
$ npm install ink-use-stdout-dimensions
```

```
$ yarn add ink-use-stdout-dimensions
```

## Usage

```js
import React from 'react';
import { render } from 'ink';
import useStdoutDimensions from 'ink-use-stdout-dimensions';

function Application() {
  const [columns, rows] = useStdoutDimensions();
  return (
    <Text>
      {columns}×{rows}
    </Text>
  );
}

render(<Application />);
```

![Demo of ink-use-stdout-dimensions](https://github.com/cameronhunter/ink-monorepo/blob/master/packages/ink-use-stdout-dimensions/demo.gif?raw=true)

## API

### `useStdoutDimensions(): [number, number]`

Returns initial `stdout` columns and rows and updates values on `resize` events.

## License

MIT © [Cameron Hunter](https://cameronhunter.co.uk)
