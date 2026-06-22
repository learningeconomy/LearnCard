/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Learncardid_Wallpaper2Inputs */

const en_learncardid_wallpaper2 = /** @type {(inputs: Learncardid_Wallpaper2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wallpaper`)
};

const es_learncardid_wallpaper2 = /** @type {(inputs: Learncardid_Wallpaper2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fondo`)
};

const fr_learncardid_wallpaper2 = /** @type {(inputs: Learncardid_Wallpaper2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fond d’écran`)
};

const ar_learncardid_wallpaper2 = /** @type {(inputs: Learncardid_Wallpaper2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الخلفية`)
};

/**
* | output |
* | --- |
* | "Wallpaper" |
*
* @param {Learncardid_Wallpaper2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const learncardid_wallpaper2 = /** @type {((inputs?: Learncardid_Wallpaper2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Learncardid_Wallpaper2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_learncardid_wallpaper2(inputs)
	if (locale === "es") return es_learncardid_wallpaper2(inputs)
	if (locale === "fr") return fr_learncardid_wallpaper2(inputs)
	return ar_learncardid_wallpaper2(inputs)
});
export { learncardid_wallpaper2 as "learnCardId.wallpaper" }