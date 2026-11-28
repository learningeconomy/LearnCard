import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.contractUpdateReview);

export default PAGES.contractUpdateReview.Component;
