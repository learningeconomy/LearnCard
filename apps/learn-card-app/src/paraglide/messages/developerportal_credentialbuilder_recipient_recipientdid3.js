/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Recipientdid3Inputs */

const en_developerportal_credentialbuilder_recipient_recipientdid3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Recipientdid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recipient ID (DID)`)
};

const es_developerportal_credentialbuilder_recipient_recipientdid3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Recipientdid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID del Destinatario (DID)`)
};

const fr_developerportal_credentialbuilder_recipient_recipientdid3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Recipientdid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID du Destinataire (DID)`)
};

const ar_developerportal_credentialbuilder_recipient_recipientdid3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Recipientdid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف المستلم (DID)`)
};

/**
* | output |
* | --- |
* | "Recipient ID (DID)" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Recipientdid3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_recipientdid3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Recipientdid3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Recipientdid3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_recipientdid3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_recipientdid3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_recipientdid3(inputs)
	return ar_developerportal_credentialbuilder_recipient_recipientdid3(inputs)
});
export { developerportal_credentialbuilder_recipient_recipientdid3 as "developerPortal.credentialBuilder.recipient.recipientDid" }