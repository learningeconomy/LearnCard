/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Links_IdsInputs */

const en_sidemenu_links_ids = /** @type {(inputs: Sidemenu_Links_IdsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`IDs`)
};

const es_sidemenu_links_ids = /** @type {(inputs: Sidemenu_Links_IdsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Identificaciones`)
};

const de_sidemenu_links_ids = /** @type {(inputs: Sidemenu_Links_IdsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ausweise`)
};

const ar_sidemenu_links_ids = /** @type {(inputs: Sidemenu_Links_IdsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الهويات`)
};

const fr_sidemenu_links_ids = /** @type {(inputs: Sidemenu_Links_IdsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Identifiants`)
};

const ko_sidemenu_links_ids = /** @type {(inputs: Sidemenu_Links_IdsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`신분증`)
};

/**
* | output |
* | --- |
* | "IDs" |
*
* @param {Sidemenu_Links_IdsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_ids = /** @type {((inputs?: Sidemenu_Links_IdsInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_IdsInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_ids(inputs)
	if (locale === "es") return es_sidemenu_links_ids(inputs)
	if (locale === "de") return de_sidemenu_links_ids(inputs)
	if (locale === "ar") return ar_sidemenu_links_ids(inputs)
	if (locale === "fr") return fr_sidemenu_links_ids(inputs)
	return ko_sidemenu_links_ids(inputs)
});
export { sidemenu_links_ids as "sidemenu.links.ids" }