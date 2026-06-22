/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Tips_Scanqrsubtitle2Inputs */

const en_dashboard_tips_scanqrsubtitle2 = /** @type {(inputs: Dashboard_Tips_Scanqrsubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claim a credential from a poster or screen`)
};

const es_dashboard_tips_scanqrsubtitle2 = /** @type {(inputs: Dashboard_Tips_Scanqrsubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reclama una credencial desde un cartel o una pantalla`)
};

const fr_dashboard_tips_scanqrsubtitle2 = /** @type {(inputs: Dashboard_Tips_Scanqrsubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récupérez une certification depuis une affiche ou un écran`)
};

const ar_dashboard_tips_scanqrsubtitle2 = /** @type {(inputs: Dashboard_Tips_Scanqrsubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`احصل على شهادة من ملصق أو شاشة`)
};

/**
* | output |
* | --- |
* | "Claim a credential from a poster or screen" |
*
* @param {Dashboard_Tips_Scanqrsubtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_tips_scanqrsubtitle2 = /** @type {((inputs?: Dashboard_Tips_Scanqrsubtitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Tips_Scanqrsubtitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_tips_scanqrsubtitle2(inputs)
	if (locale === "es") return es_dashboard_tips_scanqrsubtitle2(inputs)
	if (locale === "fr") return fr_dashboard_tips_scanqrsubtitle2(inputs)
	return ar_dashboard_tips_scanqrsubtitle2(inputs)
});
export { dashboard_tips_scanqrsubtitle2 as "dashboard.tips.scanQrSubtitle" }