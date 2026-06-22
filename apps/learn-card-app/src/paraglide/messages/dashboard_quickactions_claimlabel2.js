/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Quickactions_Claimlabel2Inputs */

const en_dashboard_quickactions_claimlabel2 = /** @type {(inputs: Dashboard_Quickactions_Claimlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use a Claim Link`)
};

const es_dashboard_quickactions_claimlabel2 = /** @type {(inputs: Dashboard_Quickactions_Claimlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usar un enlace de reclamo`)
};

const fr_dashboard_quickactions_claimlabel2 = /** @type {(inputs: Dashboard_Quickactions_Claimlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utiliser un lien de récupération`)
};

const ar_dashboard_quickactions_claimlabel2 = /** @type {(inputs: Dashboard_Quickactions_Claimlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدم رابط مطالبة`)
};

/**
* | output |
* | --- |
* | "Use a Claim Link" |
*
* @param {Dashboard_Quickactions_Claimlabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_quickactions_claimlabel2 = /** @type {((inputs?: Dashboard_Quickactions_Claimlabel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Quickactions_Claimlabel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_quickactions_claimlabel2(inputs)
	if (locale === "es") return es_dashboard_quickactions_claimlabel2(inputs)
	if (locale === "fr") return fr_dashboard_quickactions_claimlabel2(inputs)
	return ar_dashboard_quickactions_claimlabel2(inputs)
});
export { dashboard_quickactions_claimlabel2 as "dashboard.quickActions.claimLabel" }