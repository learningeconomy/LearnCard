/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Quickactions_Claimcaption2Inputs */

const en_dashboard_quickactions_claimcaption2 = /** @type {(inputs: Dashboard_Quickactions_Claimcaption2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claim a credential you were sent`)
};

const es_dashboard_quickactions_claimcaption2 = /** @type {(inputs: Dashboard_Quickactions_Claimcaption2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reclama una credencial que te enviaron`)
};

const fr_dashboard_quickactions_claimcaption2 = /** @type {(inputs: Dashboard_Quickactions_Claimcaption2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récupérez une certification qu'on vous a envoyée`)
};

const ar_dashboard_quickactions_claimcaption2 = /** @type {(inputs: Dashboard_Quickactions_Claimcaption2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`احصل على شهادة أُرسلت إليك`)
};

/**
* | output |
* | --- |
* | "Claim a credential you were sent" |
*
* @param {Dashboard_Quickactions_Claimcaption2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_quickactions_claimcaption2 = /** @type {((inputs?: Dashboard_Quickactions_Claimcaption2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Quickactions_Claimcaption2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_quickactions_claimcaption2(inputs)
	if (locale === "es") return es_dashboard_quickactions_claimcaption2(inputs)
	if (locale === "fr") return fr_dashboard_quickactions_claimcaption2(inputs)
	return ar_dashboard_quickactions_claimcaption2(inputs)
});
export { dashboard_quickactions_claimcaption2 as "dashboard.quickActions.claimCaption" }