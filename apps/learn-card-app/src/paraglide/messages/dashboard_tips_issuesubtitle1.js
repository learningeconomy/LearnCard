/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Tips_Issuesubtitle1Inputs */

const en_dashboard_tips_issuesubtitle1 = /** @type {(inputs: Dashboard_Tips_Issuesubtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send a credential to someone`)
};

const es_dashboard_tips_issuesubtitle1 = /** @type {(inputs: Dashboard_Tips_Issuesubtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envía una credencial a alguien`)
};

const fr_dashboard_tips_issuesubtitle1 = /** @type {(inputs: Dashboard_Tips_Issuesubtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer une certification à quelqu'un`)
};

const ar_dashboard_tips_issuesubtitle1 = /** @type {(inputs: Dashboard_Tips_Issuesubtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أرسل شهادة إلى شخص ما`)
};

/**
* | output |
* | --- |
* | "Send a credential to someone" |
*
* @param {Dashboard_Tips_Issuesubtitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_tips_issuesubtitle1 = /** @type {((inputs?: Dashboard_Tips_Issuesubtitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Tips_Issuesubtitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_tips_issuesubtitle1(inputs)
	if (locale === "es") return es_dashboard_tips_issuesubtitle1(inputs)
	if (locale === "fr") return fr_dashboard_tips_issuesubtitle1(inputs)
	return ar_dashboard_tips_issuesubtitle1(inputs)
});
export { dashboard_tips_issuesubtitle1 as "dashboard.tips.issueSubtitle" }