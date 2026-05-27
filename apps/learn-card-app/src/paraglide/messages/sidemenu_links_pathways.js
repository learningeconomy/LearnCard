/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Links_PathwaysInputs */

const en_sidemenu_links_pathways = /** @type {(inputs: Sidemenu_Links_PathwaysInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Journeys`)
};

const es_sidemenu_links_pathways = /** @type {(inputs: Sidemenu_Links_PathwaysInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Trayectos`)
};

const de_sidemenu_links_pathways = /** @type {(inputs: Sidemenu_Links_PathwaysInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reisen`)
};

const ar_sidemenu_links_pathways = /** @type {(inputs: Sidemenu_Links_PathwaysInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الرحلات`)
};

/**
* | output |
* | --- |
* | "Journeys" |
*
* @param {Sidemenu_Links_PathwaysInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_pathways = /** @type {((inputs?: Sidemenu_Links_PathwaysInputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_PathwaysInputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_pathways(inputs)
	if (locale === "es") return es_sidemenu_links_pathways(inputs)
	if (locale === "de") return de_sidemenu_links_pathways(inputs)
	return ar_sidemenu_links_pathways(inputs)
});
export { sidemenu_links_pathways as "sidemenu.links.pathways" }