/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Learncard_Recentactivity2Inputs */

const en_learncard_recentactivity2 = /** @type {(inputs: Learncard_Recentactivity2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recent Activity`)
};

const es_learncard_recentactivity2 = /** @type {(inputs: Learncard_Recentactivity2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actividad Reciente`)
};

const fr_learncard_recentactivity2 = /** @type {(inputs: Learncard_Recentactivity2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activité récente`)
};

const ar_learncard_recentactivity2 = /** @type {(inputs: Learncard_Recentactivity2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`النشاط الأخير`)
};

/**
* | output |
* | --- |
* | "Recent Activity" |
*
* @param {Learncard_Recentactivity2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const learncard_recentactivity2 = /** @type {((inputs?: Learncard_Recentactivity2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Learncard_Recentactivity2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_learncard_recentactivity2(inputs)
	if (locale === "es") return es_learncard_recentactivity2(inputs)
	if (locale === "fr") return fr_learncard_recentactivity2(inputs)
	return ar_learncard_recentactivity2(inputs)
});
export { learncard_recentactivity2 as "learnCard.recentActivity" }