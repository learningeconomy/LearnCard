/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_OkayInputs */

const en_contacts_okay = /** @type {(inputs: Contacts_OkayInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Okay`)
};

const es_contacts_okay = /** @type {(inputs: Contacts_OkayInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aceptar`)
};

const fr_contacts_okay = /** @type {(inputs: Contacts_OkayInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`D'accord`)
};

const ar_contacts_okay = /** @type {(inputs: Contacts_OkayInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حسناً`)
};

/**
* | output |
* | --- |
* | "Okay" |
*
* @param {Contacts_OkayInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_okay = /** @type {((inputs?: Contacts_OkayInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_OkayInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_okay(inputs)
	if (locale === "es") return es_contacts_okay(inputs)
	if (locale === "fr") return fr_contacts_okay(inputs)
	return ar_contacts_okay(inputs)
});
export { contacts_okay as "contacts.okay" }