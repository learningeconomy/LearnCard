/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Noresults3Inputs */

const en_developerportal_credentialbuilder_recipient_noresults3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Noresults3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No results added`)
};

const es_developerportal_credentialbuilder_recipient_noresults3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Noresults3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin resultados añadidos`)
};

const fr_developerportal_credentialbuilder_recipient_noresults3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Noresults3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun résultat ajouté`)
};

const ar_developerportal_credentialbuilder_recipient_noresults3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Noresults3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم تتم إضافة نتائج`)
};

/**
* | output |
* | --- |
* | "No results added" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Noresults3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_noresults3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Noresults3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Noresults3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_noresults3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_noresults3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_noresults3(inputs)
	return ar_developerportal_credentialbuilder_recipient_noresults3(inputs)
});
export { developerportal_credentialbuilder_recipient_noresults3 as "developerPortal.credentialBuilder.recipient.noResults" }