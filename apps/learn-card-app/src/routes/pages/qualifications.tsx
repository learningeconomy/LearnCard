import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.qualifications);

export default PAGES.qualifications.Component;
