/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Creditsearnedhelp4Inputs */

const en_developerportal_credentialbuilder_recipient_creditsearnedhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Creditsearnedhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credits earned by recipient`)
};

const es_developerportal_credentialbuilder_recipient_creditsearnedhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Creditsearnedhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créditos obtenidos por el destinatario`)
};

const fr_developerportal_credentialbuilder_recipient_creditsearnedhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Creditsearnedhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crédits obtenus par le destinataire`)
};

const ar_developerportal_credentialbuilder_recipient_creditsearnedhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Creditsearnedhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاعتمادات التي حصل عليها المستلم`)
};

/**
* | output |
* | --- |
* | "Credits earned by recipient" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Creditsearnedhelp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_creditsearnedhelp4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Creditsearnedhelp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Creditsearnedhelp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_creditsearnedhelp4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_creditsearnedhelp4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_creditsearnedhelp4(inputs)
	return ar_developerportal_credentialbuilder_recipient_creditsearnedhelp4(inputs)
});
export { developerportal_credentialbuilder_recipient_creditsearnedhelp4 as "developerPortal.credentialBuilder.recipient.creditsEarnedHelp" }