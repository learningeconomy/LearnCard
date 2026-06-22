/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Tips_Claimlinktitle2Inputs */

const en_dashboard_tips_claimlinktitle2 = /** @type {(inputs: Dashboard_Tips_Claimlinktitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use a claim link`)
};

const es_dashboard_tips_claimlinktitle2 = /** @type {(inputs: Dashboard_Tips_Claimlinktitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usa un enlace de reclamo`)
};

const fr_dashboard_tips_claimlinktitle2 = /** @type {(inputs: Dashboard_Tips_Claimlinktitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utiliser un lien de récupération`)
};

const ar_dashboard_tips_claimlinktitle2 = /** @type {(inputs: Dashboard_Tips_Claimlinktitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدم رابط مطالبة`)
};

/**
* | output |
* | --- |
* | "Use a claim link" |
*
* @param {Dashboard_Tips_Claimlinktitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_tips_claimlinktitle2 = /** @type {((inputs?: Dashboard_Tips_Claimlinktitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Tips_Claimlinktitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_tips_claimlinktitle2(inputs)
	if (locale === "es") return es_dashboard_tips_claimlinktitle2(inputs)
	if (locale === "fr") return fr_dashboard_tips_claimlinktitle2(inputs)
	return ar_dashboard_tips_claimlinktitle2(inputs)
});
export { dashboard_tips_claimlinktitle2 as "dashboard.tips.claimLinkTitle" }