import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.guardianAccountApproval);

export default PAGES.guardianAccountApproval.Component;
