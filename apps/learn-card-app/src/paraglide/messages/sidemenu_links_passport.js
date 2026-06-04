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

const fr_sidemenu_links_passport = /** @type {(inputs: Sidemenu_Links_PassportInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passeport`)
};

const ko_sidemenu_links_passport = /** @type {(inputs: Sidemenu_Links_PassportInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`여권`)
};

/**
* | output |
* | --- |
* | "Passport" |
*
* @param {Sidemenu_Links_PassportInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_passport = /** @type {((inputs?: Sidemenu_Links_PassportInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_PassportInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_passport(inputs)
	if (locale === "es") return es_sidemenu_links_passport(inputs)
	if (locale === "de") return de_sidemenu_links_passport(inputs)
	if (locale === "ar") return ar_sidemenu_links_passport(inputs)
	if (locale === "fr") return fr_sidemenu_links_passport(inputs)
	return ko_sidemenu_links_passport(inputs)
});
export { sidemenu_links_passport as "sidemenu.links.passport" }