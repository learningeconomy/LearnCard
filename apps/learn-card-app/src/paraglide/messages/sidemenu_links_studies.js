/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Links_StudiesInputs */

const en_sidemenu_links_studies = /** @type {(inputs: Sidemenu_Links_StudiesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Studies`)
};

const es_sidemenu_links_studies = /** @type {(inputs: Sidemenu_Links_StudiesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estudios`)
};

const de_sidemenu_links_studies = /** @type {(inputs: Sidemenu_Links_StudiesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Studien`)
};

const ar_sidemenu_links_studies = /** @type {(inputs: Sidemenu_Links_StudiesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الدراسات`)
};

/**
* | output |
* | --- |
* | "Studies" |
*
* @param {Sidemenu_Links_StudiesInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_studies = /** @type {((inputs?: Sidemenu_Links_StudiesInputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_StudiesInputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_studies(inputs)
	if (locale === "es") return es_sidemenu_links_studies(inputs)
	if (locale === "de") return de_sidemenu_links_studies(inputs)
	return ar_sidemenu_links_studies(inputs)
});
export { sidemenu_links_studies as "sidemenu.links.studies" }