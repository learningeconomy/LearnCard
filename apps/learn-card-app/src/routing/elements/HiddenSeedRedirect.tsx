import React from 'react';
import { Navigate } from 'react-router';

/** `/hidden/seed/*` moved to the developer sign-in page. */
export const HiddenSeedRedirect: React.FC = () => <Navigate replace to="/developer/sign-in" />;
