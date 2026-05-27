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
	return /** @type {LocalizedString} */ (`Identifikationen`)
};

const ar_sidemenu_links_ids = /** @type {(inputs: Sidemenu_Links_IdsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الهويات`)
};

/**
* | output |
* | --- |
* | "IDs" |
*
* @param {Sidemenu_Links_IdsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_ids = /** @type {((inputs?: Sidemenu_Links_IdsInputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_IdsInputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_ids(inputs)
	if (locale === "es") return es_sidemenu_links_ids(inputs)
	if (locale === "de") return de_sidemenu_links_ids(inputs)
	return ar_sidemenu_links_ids(inputs)
});
export { sidemenu_links_ids as "sidemenu.links.ids" }