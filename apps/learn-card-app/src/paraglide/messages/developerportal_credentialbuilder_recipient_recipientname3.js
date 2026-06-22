/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Recipientname3Inputs */

const en_developerportal_credentialbuilder_recipient_recipientname3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Recipientname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recipient Name`)
};

const es_developerportal_credentialbuilder_recipient_recipientname3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Recipientname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre del Destinatario`)
};

const fr_developerportal_credentialbuilder_recipient_recipientname3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Recipientname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom du Destinataire`)
};

const ar_developerportal_credentialbuilder_recipient_recipientname3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Recipientname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم المستلم`)
};

/**
* | output |
* | --- |
* | "Recipient Name" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Recipientname3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_recipientname3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Recipientname3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Recipientname3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_recipientname3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_recipientname3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_recipientname3(inputs)
	return ar_developerportal_credentialbuilder_recipient_recipientname3(inputs)
});
export { developerportal_credentialbuilder_recipient_recipientname3 as "developerPortal.credentialBuilder.recipient.recipientName" }