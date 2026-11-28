import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.verifySharedResume);

export default PAGES.verifySharedResume.Component;
