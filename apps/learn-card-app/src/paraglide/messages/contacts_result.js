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

const de_contacts_result = /** @type {(inputs: Contacts_ResultInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ergebnis`)
};

const ar_contacts_result = /** @type {(inputs: Contacts_ResultInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`النتيجة`)
};

const fr_contacts_result = /** @type {(inputs: Contacts_ResultInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Résultat`)
};

const ko_contacts_result = /** @type {(inputs: Contacts_ResultInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`결과`)
};

/**
* | output |
* | --- |
* | "Result" |
*
* @param {Contacts_ResultInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_result = /** @type {((inputs?: Contacts_ResultInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_ResultInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_result(inputs)
	if (locale === "es") return es_contacts_result(inputs)
	if (locale === "de") return de_contacts_result(inputs)
	if (locale === "ar") return ar_contacts_result(inputs)
	if (locale === "fr") return fr_contacts_result(inputs)
	return ko_contacts_result(inputs)
});
export { contacts_result as "contacts.result" }