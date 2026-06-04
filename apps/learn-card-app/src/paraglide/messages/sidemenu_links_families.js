/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Links_FamiliesInputs */

const en_sidemenu_links_families = /** @type {(inputs: Sidemenu_Links_FamiliesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Families`)
};

const es_sidemenu_links_families = /** @type {(inputs: Sidemenu_Links_FamiliesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Familias`)
};

const de_sidemenu_links_families = /** @type {(inputs: Sidemenu_Links_FamiliesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Familien`)
};

const ar_sidemenu_links_families = /** @type {(inputs: Sidemenu_Links_FamiliesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العائلات`)
};

const fr_sidemenu_links_families = /** @type {(inputs: Sidemenu_Links_FamiliesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Familles`)
};

const ko_sidemenu_links_families = /** @type {(inputs: Sidemenu_Links_FamiliesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`가족`)
};

/**
* | output |
* | --- |
* | "Families" |
*
* @param {Sidemenu_Links_FamiliesInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_families = /** @type {((inputs?: Sidemenu_Links_FamiliesInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_FamiliesInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_families(inputs)
	if (locale === "es") return es_sidemenu_links_families(inputs)
	if (locale === "de") return de_sidemenu_links_families(inputs)
	if (locale === "ar") return ar_sidemenu_links_families(inputs)
	if (locale === "fr") return fr_sidemenu_links_families(inputs)
	return ko_sidemenu_links_families(inputs)
});
export { sidemenu_links_families as "sidemenu.links.families" }