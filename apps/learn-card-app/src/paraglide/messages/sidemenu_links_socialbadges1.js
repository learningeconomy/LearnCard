/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Links_Socialbadges1Inputs */

const en_sidemenu_links_socialbadges1 = /** @type {(inputs: Sidemenu_Links_Socialbadges1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts`)
};

const es_sidemenu_links_socialbadges1 = /** @type {(inputs: Sidemenu_Links_Socialbadges1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts`)
};

const de_sidemenu_links_socialbadges1 = /** @type {(inputs: Sidemenu_Links_Socialbadges1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts`)
};

const ar_sidemenu_links_socialbadges1 = /** @type {(inputs: Sidemenu_Links_Socialbadges1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشارات`)
};

const fr_sidemenu_links_socialbadges1 = /** @type {(inputs: Sidemenu_Links_Socialbadges1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts`)
};

const ko_sidemenu_links_socialbadges1 = /** @type {(inputs: Sidemenu_Links_Socialbadges1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`부스트`)
};

/**
* | output |
* | --- |
* | "Boosts" |
*
* @param {Sidemenu_Links_Socialbadges1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_socialbadges1 = /** @type {((inputs?: Sidemenu_Links_Socialbadges1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_Socialbadges1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_socialbadges1(inputs)
	if (locale === "es") return es_sidemenu_links_socialbadges1(inputs)
	if (locale === "de") return de_sidemenu_links_socialbadges1(inputs)
	if (locale === "ar") return ar_sidemenu_links_socialbadges1(inputs)
	if (locale === "fr") return fr_sidemenu_links_socialbadges1(inputs)
	return ko_sidemenu_links_socialbadges1(inputs)
});
export { sidemenu_links_socialbadges1 as "sidemenu.links.socialBadges" }