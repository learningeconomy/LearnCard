import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.credentialStorageGet);

export default PAGES.credentialStorageGet.Component;
