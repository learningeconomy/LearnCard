/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Appearance_WallpaperInputs */

const en_family_appearance_wallpaper = /** @type {(inputs: Family_Appearance_WallpaperInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wallpaper`)
};

const es_family_appearance_wallpaper = /** @type {(inputs: Family_Appearance_WallpaperInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fondo de pantalla`)
};

const fr_family_appearance_wallpaper = /** @type {(inputs: Family_Appearance_WallpaperInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fond d'écran`)
};

const ar_family_appearance_wallpaper = /** @type {(inputs: Family_Appearance_WallpaperInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الخلفية`)
};

/**
* | output |
* | --- |
* | "Wallpaper" |
*
* @param {Family_Appearance_WallpaperInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_appearance_wallpaper = /** @type {((inputs?: Family_Appearance_WallpaperInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Appearance_WallpaperInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_appearance_wallpaper(inputs)
	if (locale === "es") return es_family_appearance_wallpaper(inputs)
	if (locale === "fr") return fr_family_appearance_wallpaper(inputs)
	return ar_family_appearance_wallpaper(inputs)
});
export { family_appearance_wallpaper as "family.appearance.wallpaper" }