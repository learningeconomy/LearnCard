import { ViewMode } from '../types/theme.types';
import { ThemeEnum } from '../helpers/theme-helpers';
import type { Theme } from '../validators/theme.validators';

import { createTheme } from '../shared';

import SwitcherIcon from '../../theme/images/colorful-switcher-icon.png';
import BlocksIcon from '../../theme/images/colorful-blocks-icon.png';

import { colors } from '../colors';
import { icons } from '../icons';
import { styles } from '../styles';

export const colorfulTheme: Theme = createTheme({
    id: ThemeEnum.Colorful,
    name: 'colorful',
    displayName: 'Colorful',
    colors: colors[ThemeEnum.Colorful],
    icons: icons[ThemeEnum.Colorful],
    styles: styles[ThemeEnum.Colorful],
    defaults: {
        viewMode: ViewMode.Grid,
        switcherIcon: SwitcherIcon,
        buildMyLCIcon: BlocksIcon,
    },
});
