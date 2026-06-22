/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Termplaceholder3Inputs */

const en_developerportal_credentialbuilder_recipient_termplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Termplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., Fall 2024`)
};

const es_developerportal_credentialbuilder_recipient_termplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Termplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., Otoño 2024`)
};

const fr_developerportal_credentialbuilder_recipient_termplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Termplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., Automne 2024`)
};

const ar_developerportal_credentialbuilder_recipient_termplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Termplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: خريف 2024`)
};

/**
* | output |
* | --- |
* | "e.g., Fall 2024" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Termplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_termplaceholder3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Termplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Termplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_termplaceholder3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_termplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_termplaceholder3(inputs)
	return ar_developerportal_credentialbuilder_recipient_termplaceholder3(inputs)
});
export { developerportal_credentialbuilder_recipient_termplaceholder3 as "developerPortal.credentialBuilder.recipient.termPlaceholder" }