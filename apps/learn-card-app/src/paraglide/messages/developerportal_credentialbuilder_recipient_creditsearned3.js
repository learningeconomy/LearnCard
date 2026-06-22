/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Creditsearned3Inputs */

const en_developerportal_credentialbuilder_recipient_creditsearned3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Creditsearned3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credits Earned`)
};

const es_developerportal_credentialbuilder_recipient_creditsearned3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Creditsearned3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créditos Obtenidos`)
};

const fr_developerportal_credentialbuilder_recipient_creditsearned3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Creditsearned3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crédits Obtenus`)
};

const ar_developerportal_credentialbuilder_recipient_creditsearned3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Creditsearned3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاعتمادات المكتسبة`)
};

/**
* | output |
* | --- |
* | "Credits Earned" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Creditsearned3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_creditsearned3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Creditsearned3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Creditsearned3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_creditsearned3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_creditsearned3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_creditsearned3(inputs)
	return ar_developerportal_credentialbuilder_recipient_creditsearned3(inputs)
});
export { developerportal_credentialbuilder_recipient_creditsearned3 as "developerPortal.credentialBuilder.recipient.creditsEarned" }