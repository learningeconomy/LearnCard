/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Licensenumberplaceholder4Inputs */

const en_developerportal_credentialbuilder_recipient_licensenumberplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Licensenumberplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., A-12345`)
};

const es_developerportal_credentialbuilder_recipient_licensenumberplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Licensenumberplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., A-12345`)
};

const fr_developerportal_credentialbuilder_recipient_licensenumberplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Licensenumberplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., A-12345`)
};

const ar_developerportal_credentialbuilder_recipient_licensenumberplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Licensenumberplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: A-12345`)
};

/**
* | output |
* | --- |
* | "e.g., A-12345" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Licensenumberplaceholder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_licensenumberplaceholder4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Licensenumberplaceholder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Licensenumberplaceholder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_licensenumberplaceholder4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_licensenumberplaceholder4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_licensenumberplaceholder4(inputs)
	return ar_developerportal_credentialbuilder_recipient_licensenumberplaceholder4(inputs)
});
export { developerportal_credentialbuilder_recipient_licensenumberplaceholder4 as "developerPortal.credentialBuilder.recipient.licenseNumberPlaceholder" }