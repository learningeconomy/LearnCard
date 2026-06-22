/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Resultstatushelp4Inputs */

const en_developerportal_credentialbuilder_recipient_resultstatushelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Resultstatushelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Result status`)
};

const es_developerportal_credentialbuilder_recipient_resultstatushelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Resultstatushelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estado del resultado`)
};

const fr_developerportal_credentialbuilder_recipient_resultstatushelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Resultstatushelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Statut du résultat`)
};

const ar_developerportal_credentialbuilder_recipient_resultstatushelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Resultstatushelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حالة النتيجة`)
};

/**
* | output |
* | --- |
* | "Result status" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Resultstatushelp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_resultstatushelp4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Resultstatushelp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Resultstatushelp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_resultstatushelp4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_resultstatushelp4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_resultstatushelp4(inputs)
	return ar_developerportal_credentialbuilder_recipient_resultstatushelp4(inputs)
});
export { developerportal_credentialbuilder_recipient_resultstatushelp4 as "developerPortal.credentialBuilder.recipient.resultStatusHelp" }