/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Term2Inputs */

const en_developerportal_credentialbuilder_recipient_term2 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Term2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Term`)
};

const es_developerportal_credentialbuilder_recipient_term2 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Term2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Periodo`)
};

const fr_developerportal_credentialbuilder_recipient_term2 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Term2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Période`)
};

const ar_developerportal_credentialbuilder_recipient_term2 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Term2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الفصل`)
};

/**
* | output |
* | --- |
* | "Term" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Term2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_term2 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Term2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Term2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_term2(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_term2(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_term2(inputs)
	return ar_developerportal_credentialbuilder_recipient_term2(inputs)
});
export { developerportal_credentialbuilder_recipient_term2 as "developerPortal.credentialBuilder.recipient.term" }