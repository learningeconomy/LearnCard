/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Links_Aiinsights1Inputs */

const en_sidemenu_links_aiinsights1 = /** @type {(inputs: Sidemenu_Links_Aiinsights1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Insights`)
};

const es_sidemenu_links_aiinsights1 = /** @type {(inputs: Sidemenu_Links_Aiinsights1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`IA Insights`)
};

const fr_sidemenu_links_aiinsights1 = /** @type {(inputs: Sidemenu_Links_Aiinsights1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`IA Insights`)
};

const ar_sidemenu_links_aiinsights1 = /** @type {(inputs: Sidemenu_Links_Aiinsights1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رؤى الذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "AI Insights" |
*
* @param {Sidemenu_Links_Aiinsights1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_aiinsights1 = /** @type {((inputs?: Sidemenu_Links_Aiinsights1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_Aiinsights1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_aiinsights1(inputs)
	if (locale === "es") return es_sidemenu_links_aiinsights1(inputs)
	if (locale === "fr") return fr_sidemenu_links_aiinsights1(inputs)
	return ar_sidemenu_links_aiinsights1(inputs)
});
export { sidemenu_links_aiinsights1 as "sidemenu.links.aiInsights" }