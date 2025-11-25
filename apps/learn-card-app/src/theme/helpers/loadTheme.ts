import { formalTheme } from '../schemas/formal';
import { colorfulTheme } from '../schemas/colorful';
import { ThemeEnum } from '../helpers/theme-helpers';
import { Theme, validateThemeData } from '../validators/theme.validators';

const parsedColorful = validateThemeData(colorfulTheme);
const parsedFormal = validateThemeData(formalTheme);

export const THEMES = Object.freeze({
    [ThemeEnum.Colorful]: Object.freeze(parsedColorful),
    [ThemeEnum.Formal]: Object.freeze(parsedFormal),
} as const);

export type ThemeMap = typeof THEMES;

export const loadThemeSchema = (theme: ThemeEnum): Theme => THEMES[theme];
