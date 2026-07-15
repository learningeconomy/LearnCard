/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_History_Viewid1Inputs */

const en_troops_history_viewid1 = /** @type {(inputs: Troops_History_Viewid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View ID`)
};

const es_troops_history_viewid1 = /** @type {(inputs: Troops_History_Viewid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver ID`)
};

const fr_troops_history_viewid1 = /** @type {(inputs: Troops_History_Viewid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir l'ID`)
};

const ar_troops_history_viewid1 = /** @type {(inputs: Troops_History_Viewid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض المعرف`)
};

/**
* | output |
* | --- |
* | "View ID" |
*
* @param {Troops_History_Viewid1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_history_viewid1 = /** @type {((inputs?: Troops_History_Viewid1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_History_Viewid1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_history_viewid1(inputs)
	if (locale === "es") return es_troops_history_viewid1(inputs)
	if (locale === "fr") return fr_troops_history_viewid1(inputs)
	return ar_troops_history_viewid1(inputs)
});
export { troops_history_viewid1 as "troops.history.viewId" }