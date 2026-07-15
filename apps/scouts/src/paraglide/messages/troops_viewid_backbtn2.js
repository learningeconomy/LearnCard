/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Viewid_Backbtn2Inputs */

const en_troops_viewid_backbtn2 = /** @type {(inputs: Troops_Viewid_Backbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back`)
};

const es_troops_viewid_backbtn2 = /** @type {(inputs: Troops_Viewid_Backbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Atrás`)
};

const fr_troops_viewid_backbtn2 = /** @type {(inputs: Troops_Viewid_Backbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour`)
};

const ar_troops_viewid_backbtn2 = /** @type {(inputs: Troops_Viewid_Backbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رجوع`)
};

/**
* | output |
* | --- |
* | "Back" |
*
* @param {Troops_Viewid_Backbtn2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_viewid_backbtn2 = /** @type {((inputs?: Troops_Viewid_Backbtn2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Viewid_Backbtn2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_viewid_backbtn2(inputs)
	if (locale === "es") return es_troops_viewid_backbtn2(inputs)
	if (locale === "fr") return fr_troops_viewid_backbtn2(inputs)
	return ar_troops_viewid_backbtn2(inputs)
});
export { troops_viewid_backbtn2 as "troops.viewId.backBtn" }