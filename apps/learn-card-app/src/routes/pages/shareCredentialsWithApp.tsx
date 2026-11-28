import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.shareCredentialsWithApp);

export default PAGES.shareCredentialsWithApp.Component;
