/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Recipientdidhelp4Inputs */

const en_developerportal_credentialbuilder_recipient_recipientdidhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Recipientdidhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Automatically set when the credential is sent to the recipient`)
};

const es_developerportal_credentialbuilder_recipient_recipientdidhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Recipientdidhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se establece automáticamente cuando la credencial se envía al destinatario`)
};

const fr_developerportal_credentialbuilder_recipient_recipientdidhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Recipientdidhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Automatiquement défini lors de l'envoi du crédential au destinataire`)
};

const ar_developerportal_credentialbuilder_recipient_recipientdidhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Recipientdidhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يتم تعيينه تلقائيًا عند إرسال الاعتماد إلى المستلم`)
};

/**
* | output |
* | --- |
* | "Automatically set when the credential is sent to the recipient" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Recipientdidhelp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_recipientdidhelp4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Recipientdidhelp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Recipientdidhelp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_recipientdidhelp4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_recipientdidhelp4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_recipientdidhelp4(inputs)
	return ar_developerportal_credentialbuilder_recipient_recipientdidhelp4(inputs)
});
export { developerportal_credentialbuilder_recipient_recipientdidhelp4 as "developerPortal.credentialBuilder.recipient.recipientDidHelp" }