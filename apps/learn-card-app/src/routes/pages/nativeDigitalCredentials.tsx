import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.nativeDigitalCredentials);

export default PAGES.nativeDigitalCredentials.Component;
