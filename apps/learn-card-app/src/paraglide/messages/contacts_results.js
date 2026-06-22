/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_ResultsInputs */

const en_contacts_results = /** @type {(inputs: Contacts_ResultsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Results`)
};

const es_contacts_results = /** @type {(inputs: Contacts_ResultsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resultados`)
};

const fr_contacts_results = /** @type {(inputs: Contacts_ResultsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Résultats`)
};

const ar_contacts_results = /** @type {(inputs: Contacts_ResultsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`النتائج`)
};

/**
* | output |
* | --- |
* | "Results" |
*
* @param {Contacts_ResultsInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_results = /** @type {((inputs?: Contacts_ResultsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_ResultsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_results(inputs)
	if (locale === "es") return es_contacts_results(inputs)
	if (locale === "fr") return fr_contacts_results(inputs)
	return ar_contacts_results(inputs)
});
export { contacts_results as "contacts.results" }