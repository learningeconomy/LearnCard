/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Rolehelp3Inputs */

const en_developerportal_credentialbuilder_recipient_rolehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Rolehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recipient's role`)
};

const es_developerportal_credentialbuilder_recipient_rolehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Rolehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rol del destinatario`)
};

const fr_developerportal_credentialbuilder_recipient_rolehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Rolehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rôle du destinataire`)
};

const ar_developerportal_credentialbuilder_recipient_rolehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Rolehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`دور المستلم`)
};

/**
* | output |
* | --- |
* | "Recipient's role" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Rolehelp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_rolehelp3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Rolehelp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Rolehelp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_rolehelp3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_rolehelp3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_rolehelp3(inputs)
	return ar_developerportal_credentialbuilder_recipient_rolehelp3(inputs)
});
export { developerportal_credentialbuilder_recipient_rolehelp3 as "developerPortal.credentialBuilder.recipient.roleHelp" }