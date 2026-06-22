/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Credentialbuilder_Validate_Dynamiccount3Inputs */

const en_developerportal_credentialbuilder_validate_dynamiccount3 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Dynamiccount3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} dynamic`)
};

const es_developerportal_credentialbuilder_validate_dynamiccount3 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Dynamiccount3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} dinámico`)
};

const fr_developerportal_credentialbuilder_validate_dynamiccount3 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Dynamiccount3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} dynamique`)
};

const ar_developerportal_credentialbuilder_validate_dynamiccount3 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Dynamiccount3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} متغير`)
};

/**
* | output |
* | --- |
* | "{count} dynamic" |
*
* @param {Developerportal_Credentialbuilder_Validate_Dynamiccount3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validate_dynamiccount3 = /** @type {((inputs: Developerportal_Credentialbuilder_Validate_Dynamiccount3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validate_Dynamiccount3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validate_dynamiccount3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validate_dynamiccount3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validate_dynamiccount3(inputs)
	return ar_developerportal_credentialbuilder_validate_dynamiccount3(inputs)
});
export { developerportal_credentialbuilder_validate_dynamiccount3 as "developerPortal.credentialBuilder.validate.dynamicCount" }