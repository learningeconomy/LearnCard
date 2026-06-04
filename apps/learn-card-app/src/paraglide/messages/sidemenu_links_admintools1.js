/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Links_Admintools1Inputs */

const en_sidemenu_links_admintools1 = /** @type {(inputs: Sidemenu_Links_Admintools1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin Tools`)
};

const es_sidemenu_links_admintools1 = /** @type {(inputs: Sidemenu_Links_Admintools1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Herramientas de administración`)
};

const de_sidemenu_links_admintools1 = /** @type {(inputs: Sidemenu_Links_Admintools1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin-Werkzeuge`)
};

const ar_sidemenu_links_admintools1 = /** @type {(inputs: Sidemenu_Links_Admintools1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدوات الإدارة`)
};

const fr_sidemenu_links_admintools1 = /** @type {(inputs: Sidemenu_Links_Admintools1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Outils d'administration`)
};

const ko_sidemenu_links_admintools1 = /** @type {(inputs: Sidemenu_Links_Admintools1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`관리 도구`)
};

/**
* | output |
* | --- |
* | "Admin Tools" |
*
* @param {Sidemenu_Links_Admintools1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_admintools1 = /** @type {((inputs?: Sidemenu_Links_Admintools1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_Admintools1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_admintools1(inputs)
	if (locale === "es") return es_sidemenu_links_admintools1(inputs)
	if (locale === "de") return de_sidemenu_links_admintools1(inputs)
	if (locale === "ar") return ar_sidemenu_links_admintools1(inputs)
	if (locale === "fr") return fr_sidemenu_links_admintools1(inputs)
	return ko_sidemenu_links_admintools1(inputs)
});
export { sidemenu_links_admintools1 as "sidemenu.links.adminTools" }