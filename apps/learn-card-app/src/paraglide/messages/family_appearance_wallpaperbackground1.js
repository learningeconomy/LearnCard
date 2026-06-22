/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Appearance_Wallpaperbackground1Inputs */

const en_family_appearance_wallpaperbackground1 = /** @type {(inputs: Family_Appearance_Wallpaperbackground1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wallpaper Background`)
};

const es_family_appearance_wallpaperbackground1 = /** @type {(inputs: Family_Appearance_Wallpaperbackground1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fondo de pantalla`)
};

const fr_family_appearance_wallpaperbackground1 = /** @type {(inputs: Family_Appearance_Wallpaperbackground1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fond d'écran`)
};

const ar_family_appearance_wallpaperbackground1 = /** @type {(inputs: Family_Appearance_Wallpaperbackground1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خلفية الشاشة`)
};

/**
* | output |
* | --- |
* | "Wallpaper Background" |
*
* @param {Family_Appearance_Wallpaperbackground1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_appearance_wallpaperbackground1 = /** @type {((inputs?: Family_Appearance_Wallpaperbackground1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Appearance_Wallpaperbackground1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_appearance_wallpaperbackground1(inputs)
	if (locale === "es") return es_family_appearance_wallpaperbackground1(inputs)
	if (locale === "fr") return fr_family_appearance_wallpaperbackground1(inputs)
	return ar_family_appearance_wallpaperbackground1(inputs)
});
export { family_appearance_wallpaperbackground1 as "family.appearance.wallpaperBackground" }