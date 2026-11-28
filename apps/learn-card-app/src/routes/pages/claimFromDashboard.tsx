import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.claimFromDashboard);

export default PAGES.claimFromDashboard.Component;
