/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Viewid_Closebtn2Inputs */

const en_troops_viewid_closebtn2 = /** @type {(inputs: Troops_Viewid_Closebtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Close`)
};

const es_troops_viewid_closebtn2 = /** @type {(inputs: Troops_Viewid_Closebtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cerrar`)
};

const fr_troops_viewid_closebtn2 = /** @type {(inputs: Troops_Viewid_Closebtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fermer`)
};

const ar_troops_viewid_closebtn2 = /** @type {(inputs: Troops_Viewid_Closebtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إغلاق`)
};

/**
* | output |
* | --- |
* | "Close" |
*
* @param {Troops_Viewid_Closebtn2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_viewid_closebtn2 = /** @type {((inputs?: Troops_Viewid_Closebtn2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Viewid_Closebtn2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_viewid_closebtn2(inputs)
	if (locale === "es") return es_troops_viewid_closebtn2(inputs)
	if (locale === "fr") return fr_troops_viewid_closebtn2(inputs)
	return ar_troops_viewid_closebtn2(inputs)
});
export { troops_viewid_closebtn2 as "troops.viewId.closeBtn" }