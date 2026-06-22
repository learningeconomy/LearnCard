/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_ResultInputs */

const en_contacts_result = /** @type {(inputs: Contacts_ResultInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Result`)
};

const es_contacts_result = /** @type {(inputs: Contacts_ResultInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resultado`)
};

const fr_contacts_result = /** @type {(inputs: Contacts_ResultInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Résultat`)
};

const ar_contacts_result = /** @type {(inputs: Contacts_ResultInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`النتيجة`)
};

/**
* | output |
* | --- |
* | "Result" |
*
* @param {Contacts_ResultInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_result = /** @type {((inputs?: Contacts_ResultInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_ResultInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_result(inputs)
	if (locale === "es") return es_contacts_result(inputs)
	if (locale === "fr") return fr_contacts_result(inputs)
	return ar_contacts_result(inputs)
});
export { contacts_result as "contacts.result" }