/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Links_Aipathways1Inputs */

const en_sidemenu_links_aipathways1 = /** @type {(inputs: Sidemenu_Links_Aipathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Pathways`)
};

const es_sidemenu_links_aipathways1 = /** @type {(inputs: Sidemenu_Links_Aipathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`IA Pathways`)
};

const fr_sidemenu_links_aipathways1 = /** @type {(inputs: Sidemenu_Links_Aipathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`IA Pathways`)
};

const ar_sidemenu_links_aipathways1 = /** @type {(inputs: Sidemenu_Links_Aipathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسارات الذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "AI Pathways" |
*
* @param {Sidemenu_Links_Aipathways1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_aipathways1 = /** @type {((inputs?: Sidemenu_Links_Aipathways1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_Aipathways1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_aipathways1(inputs)
	if (locale === "es") return es_sidemenu_links_aipathways1(inputs)
	if (locale === "fr") return fr_sidemenu_links_aipathways1(inputs)
	return ar_sidemenu_links_aipathways1(inputs)
});
export { sidemenu_links_aipathways1 as "sidemenu.links.aiPathways" }