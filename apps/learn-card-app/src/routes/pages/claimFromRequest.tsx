import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.claimFromRequest);

export default PAGES.claimFromRequest.Component;
