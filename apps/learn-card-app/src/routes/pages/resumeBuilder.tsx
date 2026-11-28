import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.resumeBuilder);

export default PAGES.resumeBuilder.Component;
