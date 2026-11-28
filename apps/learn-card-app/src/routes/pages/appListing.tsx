import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';
import { ROUTE_DATA } from '../../routing/routeData';

export const clientLoader = pageClientLoader(PAGES.appListing, ROUTE_DATA.appListing);

export default PAGES.appListing.Component;
