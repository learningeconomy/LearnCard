/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Tips_Claimlinksubtitle2Inputs */

const en_dashboard_tips_claimlinksubtitle2 = /** @type {(inputs: Dashboard_Tips_Claimlinksubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paste or upload a credential link`)
};

const es_dashboard_tips_claimlinksubtitle2 = /** @type {(inputs: Dashboard_Tips_Claimlinksubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pega o sube un enlace de credencial`)
};

const fr_dashboard_tips_claimlinksubtitle2 = /** @type {(inputs: Dashboard_Tips_Claimlinksubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Collez ou importez un lien de certification`)
};

const ar_dashboard_tips_claimlinksubtitle2 = /** @type {(inputs: Dashboard_Tips_Claimlinksubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الصق أو ارفع رابط شهادة`)
};

/**
* | output |
* | --- |
* | "Paste or upload a credential link" |
*
* @param {Dashboard_Tips_Claimlinksubtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_tips_claimlinksubtitle2 = /** @type {((inputs?: Dashboard_Tips_Claimlinksubtitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Tips_Claimlinksubtitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_tips_claimlinksubtitle2(inputs)
	if (locale === "es") return es_dashboard_tips_claimlinksubtitle2(inputs)
	if (locale === "fr") return fr_dashboard_tips_claimlinksubtitle2(inputs)
	return ar_dashboard_tips_claimlinksubtitle2(inputs)
});
export { dashboard_tips_claimlinksubtitle2 as "dashboard.tips.claimLinkSubtitle" }