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

const fr_sidemenu_links_pathways = /** @type {(inputs: Sidemenu_Links_PathwaysInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parcours`)
};

const ar_sidemenu_links_pathways = /** @type {(inputs: Sidemenu_Links_PathwaysInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المسارات`)
};

/**
* | output |
* | --- |
* | "Journeys" |
*
* @param {Sidemenu_Links_PathwaysInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_pathways = /** @type {((inputs?: Sidemenu_Links_PathwaysInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_PathwaysInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_pathways(inputs)
	if (locale === "es") return es_sidemenu_links_pathways(inputs)
	if (locale === "fr") return fr_sidemenu_links_pathways(inputs)
	return ar_sidemenu_links_pathways(inputs)
});
export { sidemenu_links_pathways as "sidemenu.links.pathways" }