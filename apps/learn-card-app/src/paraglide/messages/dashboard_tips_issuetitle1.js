/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Tips_Issuetitle1Inputs */

const en_dashboard_tips_issuetitle1 = /** @type {(inputs: Dashboard_Tips_Issuetitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue a credential`)
};

const es_dashboard_tips_issuetitle1 = /** @type {(inputs: Dashboard_Tips_Issuetitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emite una credencial`)
};

const fr_dashboard_tips_issuetitle1 = /** @type {(inputs: Dashboard_Tips_Issuetitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émettre une certification`)
};

const ar_dashboard_tips_issuetitle1 = /** @type {(inputs: Dashboard_Tips_Issuetitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أصدر شهادة`)
};

/**
* | output |
* | --- |
* | "Issue a credential" |
*
* @param {Dashboard_Tips_Issuetitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_tips_issuetitle1 = /** @type {((inputs?: Dashboard_Tips_Issuetitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Tips_Issuetitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_tips_issuetitle1(inputs)
	if (locale === "es") return es_dashboard_tips_issuetitle1(inputs)
	if (locale === "fr") return fr_dashboard_tips_issuetitle1(inputs)
	return ar_dashboard_tips_issuetitle1(inputs)
});
export { dashboard_tips_issuetitle1 as "dashboard.tips.issueTitle" }