/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Links_Socialbadges1Inputs */

const en_sidemenu_links_socialbadges1 = /** @type {(inputs: Sidemenu_Links_Socialbadges1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts`)
};

const es_sidemenu_links_socialbadges1 = /** @type {(inputs: Sidemenu_Links_Socialbadges1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insignias`)
};

const de_sidemenu_links_socialbadges1 = /** @type {(inputs: Sidemenu_Links_Socialbadges1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abzeichen`)
};

const ar_sidemenu_links_socialbadges1 = /** @type {(inputs: Sidemenu_Links_Socialbadges1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشارات`)
};

/**
* | output |
* | --- |
* | "Boosts" |
*
* @param {Sidemenu_Links_Socialbadges1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_socialbadges1 = /** @type {((inputs?: Sidemenu_Links_Socialbadges1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_Socialbadges1Inputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_socialbadges1(inputs)
	if (locale === "es") return es_sidemenu_links_socialbadges1(inputs)
	if (locale === "de") return de_sidemenu_links_socialbadges1(inputs)
	return ar_sidemenu_links_socialbadges1(inputs)
});
export { sidemenu_links_socialbadges1 as "sidemenu.links.socialBadges" }