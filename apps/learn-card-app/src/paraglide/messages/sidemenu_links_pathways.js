/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Links_PathwaysInputs */

const en_sidemenu_links_pathways = /** @type {(inputs: Sidemenu_Links_PathwaysInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Journeys`)
};

const es_sidemenu_links_pathways = /** @type {(inputs: Sidemenu_Links_PathwaysInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Caminos`)
};

const de_sidemenu_links_pathways = /** @type {(inputs: Sidemenu_Links_PathwaysInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pfade`)
};

const ar_sidemenu_links_pathways = /** @type {(inputs: Sidemenu_Links_PathwaysInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المسارات`)
};

const fr_sidemenu_links_pathways = /** @type {(inputs: Sidemenu_Links_PathwaysInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parcours`)
};

const ko_sidemenu_links_pathways = /** @type {(inputs: Sidemenu_Links_PathwaysInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`경로`)
};

/**
* | output |
* | --- |
* | "Journeys" |
*
* @param {Sidemenu_Links_PathwaysInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_pathways = /** @type {((inputs?: Sidemenu_Links_PathwaysInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_PathwaysInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_pathways(inputs)
	if (locale === "es") return es_sidemenu_links_pathways(inputs)
	if (locale === "de") return de_sidemenu_links_pathways(inputs)
	if (locale === "ar") return ar_sidemenu_links_pathways(inputs)
	if (locale === "fr") return fr_sidemenu_links_pathways(inputs)
	return ko_sidemenu_links_pathways(inputs)
});
export { sidemenu_links_pathways as "sidemenu.links.pathways" }