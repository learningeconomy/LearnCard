/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validation_Invalidctid3Inputs */

const en_developerportal_credentialbuilder_validation_invalidctid3 = /** @type {(inputs: Developerportal_Credentialbuilder_Validation_Invalidctid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid CTID format. Must be ce-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
};

const es_developerportal_credentialbuilder_validation_invalidctid3 = /** @type {(inputs: Developerportal_Credentialbuilder_Validation_Invalidctid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid CTID format. Must be ce-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
};

const fr_developerportal_credentialbuilder_validation_invalidctid3 = /** @type {(inputs: Developerportal_Credentialbuilder_Validation_Invalidctid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid CTID format. Must be ce-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
};

const ar_developerportal_credentialbuilder_validation_invalidctid3 = /** @type {(inputs: Developerportal_Credentialbuilder_Validation_Invalidctid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid CTID format. Must be ce-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
};

/**
* | output |
* | --- |
* | "Invalid CTID format. Must be ce-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" |
*
* @param {Developerportal_Credentialbuilder_Validation_Invalidctid3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validation_invalidctid3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validation_Invalidctid3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validation_Invalidctid3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validation_invalidctid3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validation_invalidctid3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validation_invalidctid3(inputs)
	return ar_developerportal_credentialbuilder_validation_invalidctid3(inputs)
});
export { developerportal_credentialbuilder_validation_invalidctid3 as "developerPortal.credentialBuilder.validation.invalidCtid" }