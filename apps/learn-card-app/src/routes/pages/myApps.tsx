import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';
import { ROUTE_DATA } from '../../routing/routeData';

export const clientLoader = pageClientLoader(PAGES.myApps, ROUTE_DATA.myApps);

export default PAGES.myApps.Component;
