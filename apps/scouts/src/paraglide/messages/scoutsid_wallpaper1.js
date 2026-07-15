/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scoutsid_Wallpaper1Inputs */

const en_scoutsid_wallpaper1 = /** @type {(inputs: Scoutsid_Wallpaper1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wallpaper`)
};

const es_scoutsid_wallpaper1 = /** @type {(inputs: Scoutsid_Wallpaper1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fondo de Pantalla`)
};

const fr_scoutsid_wallpaper1 = /** @type {(inputs: Scoutsid_Wallpaper1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fond d'écran`)
};

const ar_scoutsid_wallpaper1 = /** @type {(inputs: Scoutsid_Wallpaper1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wallpaper`)
};

/**
* | output |
* | --- |
* | "Wallpaper" |
*
* @param {Scoutsid_Wallpaper1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scoutsid_wallpaper1 = /** @type {((inputs?: Scoutsid_Wallpaper1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scoutsid_Wallpaper1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scoutsid_wallpaper1(inputs)
	if (locale === "es") return es_scoutsid_wallpaper1(inputs)
	if (locale === "fr") return fr_scoutsid_wallpaper1(inputs)
	return ar_scoutsid_wallpaper1(inputs)
});
export { scoutsid_wallpaper1 as "scoutsId.wallpaper" }