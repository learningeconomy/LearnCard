import { useHistory } from 'react-router-dom';

import { BrandingEnum } from 'learn-card-base';

/**
 * Navigates to the current user's "My LearnCard" profile/settings view at
 * `/profile` (rendered by `ProfilePage`).
 *
 * Shared by the header profile avatar (MainHeader) and the side-menu Settings
 * row (LC-1921) so the two entry points can never drift on where they land.
 *
 * Previously this opened `MyLearnCardModal` in a Freeform modal; LC-1921 moved
 * the view to a first-class route so it lays out beside the side menu on
 * desktop instead of as an overlay. The `branding` arg is retained for
 * signature compatibility with existing callers.
 */
export const useOpenMyLearnCard = (_branding: BrandingEnum = BrandingEnum.learncard) => {
    const history = useHistory();

    return () => history.push('/profile');
};

export default useOpenMyLearnCard;
