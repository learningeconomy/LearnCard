/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Resultvaluehelp4Inputs */

const en_developerportal_credentialbuilder_recipient_resultvaluehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Resultvaluehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The achieved result`)
};

const es_developerportal_credentialbuilder_recipient_resultvaluehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Resultvaluehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El resultado obtenido`)
};

const fr_developerportal_credentialbuilder_recipient_resultvaluehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Resultvaluehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le résultat obtenu`)
};

const ar_developerportal_credentialbuilder_recipient_resultvaluehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Resultvaluehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`النتيجة المحققة`)
};

/**
* | output |
* | --- |
* | "The achieved result" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Resultvaluehelp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_resultvaluehelp4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Resultvaluehelp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Resultvaluehelp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_resultvaluehelp4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_resultvaluehelp4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_resultvaluehelp4(inputs)
	return ar_developerportal_credentialbuilder_recipient_resultvaluehelp4(inputs)
});
export { developerportal_credentialbuilder_recipient_resultvaluehelp4 as "developerPortal.credentialBuilder.recipient.resultValueHelp" }