/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Viewid_Detailsbtn2Inputs */

const en_troops_viewid_detailsbtn2 = /** @type {(inputs: Troops_Viewid_Detailsbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Details`)
};

const es_troops_viewid_detailsbtn2 = /** @type {(inputs: Troops_Viewid_Detailsbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Detalles`)
};

const fr_troops_viewid_detailsbtn2 = /** @type {(inputs: Troops_Viewid_Detailsbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Détails`)
};

const ar_troops_viewid_detailsbtn2 = /** @type {(inputs: Troops_Viewid_Detailsbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التفاصيل`)
};

/**
* | output |
* | --- |
* | "Details" |
*
* @param {Troops_Viewid_Detailsbtn2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_viewid_detailsbtn2 = /** @type {((inputs?: Troops_Viewid_Detailsbtn2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Viewid_Detailsbtn2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_viewid_detailsbtn2(inputs)
	if (locale === "es") return es_troops_viewid_detailsbtn2(inputs)
	if (locale === "fr") return fr_troops_viewid_detailsbtn2(inputs)
	return ar_troops_viewid_detailsbtn2(inputs)
});
export { troops_viewid_detailsbtn2 as "troops.viewId.detailsBtn" }