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

const fr_sidemenu_links_admintools1 = /** @type {(inputs: Sidemenu_Links_Admintools1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Outils d'administration`)
};

const ar_sidemenu_links_admintools1 = /** @type {(inputs: Sidemenu_Links_Admintools1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدوات الإدارة`)
};

/**
* | output |
* | --- |
* | "Admin Tools" |
*
* @param {Sidemenu_Links_Admintools1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_admintools1 = /** @type {((inputs?: Sidemenu_Links_Admintools1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_Admintools1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_admintools1(inputs)
	if (locale === "es") return es_sidemenu_links_admintools1(inputs)
	if (locale === "fr") return fr_sidemenu_links_admintools1(inputs)
	return ar_sidemenu_links_admintools1(inputs)
});
export { sidemenu_links_admintools1 as "sidemenu.links.adminTools" }