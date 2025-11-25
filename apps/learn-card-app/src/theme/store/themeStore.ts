import { createStore } from '@udecode/zustood';
import { ThemeEnum } from '../helpers/theme-helpers';

export const themeStore = createStore('themeStore')<{
    theme: ThemeEnum;
}>({ theme: ThemeEnum.Colorful }, { persist: { name: 'themeStore', enabled: true } });

export default themeStore;
