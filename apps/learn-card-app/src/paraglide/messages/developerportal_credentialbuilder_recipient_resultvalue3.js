/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Resultvalue3Inputs */

const en_developerportal_credentialbuilder_recipient_resultvalue3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Resultvalue3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Value`)
};

const es_developerportal_credentialbuilder_recipient_resultvalue3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Resultvalue3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Valor`)
};

const fr_developerportal_credentialbuilder_recipient_resultvalue3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Resultvalue3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Valeur`)
};

const ar_developerportal_credentialbuilder_recipient_resultvalue3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Resultvalue3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`القيمة`)
};

/**
* | output |
* | --- |
* | "Value" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Resultvalue3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_resultvalue3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Resultvalue3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Resultvalue3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_resultvalue3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_resultvalue3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_resultvalue3(inputs)
	return ar_developerportal_credentialbuilder_recipient_resultvalue3(inputs)
});
export { developerportal_credentialbuilder_recipient_resultvalue3 as "developerPortal.credentialBuilder.recipient.resultValue" }