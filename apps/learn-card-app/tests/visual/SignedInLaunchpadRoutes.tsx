import React from 'react';
import { Route } from 'react-router-dom';
import MyAppsLanding from '../../src/pages/myApps/MyAppsLanding';

// Keep the real Ionic tabs/outlet, while excluding unrelated authenticated routes.
export const Routes: React.FC = () => <Route exact path="/launchpad" component={MyAppsLanding} />;
