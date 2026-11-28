import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.clrTranscriptDemo);

export default PAGES.clrTranscriptDemo.Component;
