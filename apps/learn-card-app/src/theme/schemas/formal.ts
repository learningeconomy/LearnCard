import { ViewMode } from '../types/theme.types';
import { ThemeEnum } from '../helpers/theme-helpers';
import type { Theme } from '../validators/theme.validators';

import { createTheme } from '../shared';

import SwitcherIcon from '../../theme/images/formal-switcher-icon.png';
import BlocksIcon from '../../theme/images/formal-blocks-icon.png';

import { colors } from '../colors';
import { icons } from '../icons';
import { styles } from '../styles';

export const formalTheme: Theme = createTheme({
    id: ThemeEnum.Formal,
    name: 'formal',
    displayName: 'Formal',
    colors: colors[ThemeEnum.Formal],
    icons: icons[ThemeEnum.Formal],
    styles: styles[ThemeEnum.Formal],
    defaults: {
        viewMode: ViewMode.List,
        switcherIcon: SwitcherIcon,
        buildMyLCIcon: BlocksIcon,
    },
});
