import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.updateBoostCms);

export default PAGES.updateBoostCms.Component;
