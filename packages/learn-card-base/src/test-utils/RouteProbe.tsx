import type React from 'react';
import { useLocation, useParams } from 'react-router';
import type { Location, Params } from 'react-router';

/** Renders a matched route's params and location in tests, like React Router 5's `render` prop. */
export const RouteProbe: React.FC<{
    render: (params: Readonly<Params>, location: Location) => React.ReactNode;
}> = ({ render }) => <>{render(useParams(), useLocation())}</>;
