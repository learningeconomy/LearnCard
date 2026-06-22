/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Licensenumberhelp4Inputs */

const en_developerportal_credentialbuilder_recipient_licensenumberhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Licensenumberhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`License or certificate number`)
};

const es_developerportal_credentialbuilder_recipient_licensenumberhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Licensenumberhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Número de licencia o certificado`)
};

const fr_developerportal_credentialbuilder_recipient_licensenumberhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Licensenumberhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Numéro de licence ou de certificat`)
};

const ar_developerportal_credentialbuilder_recipient_licensenumberhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Licensenumberhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رقم الترخيص أو الشهادة`)
};

/**
* | output |
* | --- |
* | "License or certificate number" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Licensenumberhelp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_licensenumberhelp4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Licensenumberhelp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Licensenumberhelp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_licensenumberhelp4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_licensenumberhelp4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_licensenumberhelp4(inputs)
	return ar_developerportal_credentialbuilder_recipient_licensenumberhelp4(inputs)
});
export { developerportal_credentialbuilder_recipient_licensenumberhelp4 as "developerPortal.credentialBuilder.recipient.licenseNumberHelp" }