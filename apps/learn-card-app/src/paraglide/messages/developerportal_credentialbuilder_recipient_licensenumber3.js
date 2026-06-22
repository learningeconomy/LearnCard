/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Licensenumber3Inputs */

const en_developerportal_credentialbuilder_recipient_licensenumber3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Licensenumber3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`License Number`)
};

const es_developerportal_credentialbuilder_recipient_licensenumber3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Licensenumber3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Número de Licencia`)
};

const fr_developerportal_credentialbuilder_recipient_licensenumber3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Licensenumber3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Numéro de Licence`)
};

const ar_developerportal_credentialbuilder_recipient_licensenumber3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Licensenumber3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رقم الترخيص`)
};

/**
* | output |
* | --- |
* | "License Number" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Licensenumber3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_licensenumber3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Licensenumber3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Licensenumber3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_licensenumber3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_licensenumber3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_licensenumber3(inputs)
	return ar_developerportal_credentialbuilder_recipient_licensenumber3(inputs)
});
export { developerportal_credentialbuilder_recipient_licensenumber3 as "developerPortal.credentialBuilder.recipient.licenseNumber" }