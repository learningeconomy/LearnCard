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

const de_sidemenu_links_passport = /** @type {(inputs: Sidemenu_Links_PassportInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pass`)
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
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_passport = /** @type {((inputs?: Sidemenu_Links_PassportInputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_PassportInputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_passport(inputs)
	if (locale === "es") return es_sidemenu_links_passport(inputs)
	if (locale === "de") return de_sidemenu_links_passport(inputs)
	return ar_sidemenu_links_passport(inputs)
});
export { sidemenu_links_passport as "sidemenu.links.passport" }