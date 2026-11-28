import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.vcClaimModal);

export default PAGES.vcClaimModal.Component;
