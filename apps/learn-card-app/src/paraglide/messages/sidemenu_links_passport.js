/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Links_PassportInputs */

const en_sidemenu_links_passport = /** @type {(inputs: Sidemenu_Links_PassportInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passport`)
};

const es_sidemenu_links_passport = /** @type {(inputs: Sidemenu_Links_PassportInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pasaporte`)
};

const fr_sidemenu_links_passport = /** @type {(inputs: Sidemenu_Links_PassportInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passeport`)
};

const ar_sidemenu_links_passport = /** @type {(inputs: Sidemenu_Links_PassportInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جواز السفر`)
};

/**
* | output |
* | --- |
* | "Passport" |
*
* @param {Sidemenu_Links_PassportInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_passport = /** @type {((inputs?: Sidemenu_Links_PassportInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_PassportInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_passport(inputs)
	if (locale === "es") return es_sidemenu_links_passport(inputs)
	if (locale === "fr") return fr_sidemenu_links_passport(inputs)
	return ar_sidemenu_links_passport(inputs)
});
export { sidemenu_links_passport as "sidemenu.links.passport" }