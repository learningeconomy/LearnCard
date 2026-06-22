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

const fr_sidemenu_links_families = /** @type {(inputs: Sidemenu_Links_FamiliesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Familles`)
};

const ar_sidemenu_links_families = /** @type {(inputs: Sidemenu_Links_FamiliesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العائلات`)
};

/**
* | output |
* | --- |
* | "Families" |
*
* @param {Sidemenu_Links_FamiliesInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_families = /** @type {((inputs?: Sidemenu_Links_FamiliesInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_FamiliesInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_families(inputs)
	if (locale === "es") return es_sidemenu_links_families(inputs)
	if (locale === "fr") return fr_sidemenu_links_families(inputs)
	return ar_sidemenu_links_families(inputs)
});
export { sidemenu_links_families as "sidemenu.links.families" }