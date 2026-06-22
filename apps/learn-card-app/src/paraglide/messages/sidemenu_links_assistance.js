/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Links_AssistanceInputs */

const en_sidemenu_links_assistance = /** @type {(inputs: Sidemenu_Links_AssistanceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assistance`)
};

const es_sidemenu_links_assistance = /** @type {(inputs: Sidemenu_Links_AssistanceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Asistencia`)
};

const fr_sidemenu_links_assistance = /** @type {(inputs: Sidemenu_Links_AssistanceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assistance`)
};

const ar_sidemenu_links_assistance = /** @type {(inputs: Sidemenu_Links_AssistanceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المساعدة`)
};

/**
* | output |
* | --- |
* | "Assistance" |
*
* @param {Sidemenu_Links_AssistanceInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_assistance = /** @type {((inputs?: Sidemenu_Links_AssistanceInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_AssistanceInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_assistance(inputs)
	if (locale === "es") return es_sidemenu_links_assistance(inputs)
	if (locale === "fr") return fr_sidemenu_links_assistance(inputs)
	return ar_sidemenu_links_assistance(inputs)
});
export { sidemenu_links_assistance as "sidemenu.links.assistance" }