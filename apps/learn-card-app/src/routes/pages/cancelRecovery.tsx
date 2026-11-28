import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.cancelRecovery);

export default PAGES.cancelRecovery.Component;
