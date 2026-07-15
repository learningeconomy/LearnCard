/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Contacts1Inputs */

const en_launchpad_contacts1 = /** @type {(inputs: Launchpad_Contacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacts`)
};

const es_launchpad_contacts1 = /** @type {(inputs: Launchpad_Contacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contactos`)
};

const fr_launchpad_contacts1 = /** @type {(inputs: Launchpad_Contacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacts`)
};

const ar_launchpad_contacts1 = /** @type {(inputs: Launchpad_Contacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جهات الاتصال`)
};

/**
* | output |
* | --- |
* | "Contacts" |
*
* @param {Launchpad_Contacts1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_contacts1 = /** @type {((inputs?: Launchpad_Contacts1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Contacts1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_contacts1(inputs)
	if (locale === "es") return es_launchpad_contacts1(inputs)
	if (locale === "fr") return fr_launchpad_contacts1(inputs)
	return ar_launchpad_contacts1(inputs)
});
export { launchpad_contacts1 as "launchPad.contacts" }