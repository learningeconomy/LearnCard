/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Links_Aitopics1Inputs */

const en_sidemenu_links_aitopics1 = /** @type {(inputs: Sidemenu_Links_Aitopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Sessions`)
};

const es_sidemenu_links_aitopics1 = /** @type {(inputs: Sidemenu_Links_Aitopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sesiones IA`)
};

const de_sidemenu_links_aitopics1 = /** @type {(inputs: Sidemenu_Links_Aitopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`KI-Sitzungen`)
};

const ar_sidemenu_links_aitopics1 = /** @type {(inputs: Sidemenu_Links_Aitopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جلسات الذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "AI Sessions" |
*
* @param {Sidemenu_Links_Aitopics1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_aitopics1 = /** @type {((inputs?: Sidemenu_Links_Aitopics1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_Aitopics1Inputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_aitopics1(inputs)
	if (locale === "es") return es_sidemenu_links_aitopics1(inputs)
	if (locale === "de") return de_sidemenu_links_aitopics1(inputs)
	return ar_sidemenu_links_aitopics1(inputs)
});
export { sidemenu_links_aitopics1 as "sidemenu.links.aiTopics" }