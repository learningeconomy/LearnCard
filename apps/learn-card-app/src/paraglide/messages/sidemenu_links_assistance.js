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

const de_sidemenu_links_assistance = /** @type {(inputs: Sidemenu_Links_AssistanceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hilfe`)
};

const ar_sidemenu_links_assistance = /** @type {(inputs: Sidemenu_Links_AssistanceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المساعدة`)
};

const fr_sidemenu_links_assistance = /** @type {(inputs: Sidemenu_Links_AssistanceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assistance`)
};

const ko_sidemenu_links_assistance = /** @type {(inputs: Sidemenu_Links_AssistanceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`지원`)
};

/**
* | output |
* | --- |
* | "Assistance" |
*
* @param {Sidemenu_Links_AssistanceInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_assistance = /** @type {((inputs?: Sidemenu_Links_AssistanceInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_AssistanceInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_assistance(inputs)
	if (locale === "es") return es_sidemenu_links_assistance(inputs)
	if (locale === "de") return de_sidemenu_links_assistance(inputs)
	if (locale === "ar") return ar_sidemenu_links_assistance(inputs)
	if (locale === "fr") return fr_sidemenu_links_assistance(inputs)
	return ko_sidemenu_links_assistance(inputs)
});
export { sidemenu_links_assistance as "sidemenu.links.assistance" }