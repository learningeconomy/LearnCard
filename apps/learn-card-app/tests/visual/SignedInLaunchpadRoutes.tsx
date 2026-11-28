import React from 'react';
import { useLocation } from 'react-router';
import MyAppsLanding from '../../src/pages/myApps/MyAppsLanding';

// Stands in for the app's RoutesOutlet: the real shell around just the launchpad page.
export const RoutesOutlet: React.FC = () =>
    useLocation().pathname === '/launchpad' ? <MyAppsLanding /> : null;
