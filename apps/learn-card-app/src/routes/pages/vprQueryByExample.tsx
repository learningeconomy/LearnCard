import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.vprQueryByExample);

export default PAGES.vprQueryByExample.Component;
