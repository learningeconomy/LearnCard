/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validate_Changed2Inputs */

const en_developerportal_credentialbuilder_validate_changed2 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Changed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Changed`)
};

const es_developerportal_credentialbuilder_validate_changed2 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Changed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cambiado`)
};

const fr_developerportal_credentialbuilder_validate_changed2 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Changed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifié`)
};

const ar_developerportal_credentialbuilder_validate_changed2 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Changed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تغير`)
};

/**
* | output |
* | --- |
* | "Changed" |
*
* @param {Developerportal_Credentialbuilder_Validate_Changed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validate_changed2 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validate_Changed2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validate_Changed2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validate_changed2(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validate_changed2(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validate_changed2(inputs)
	return ar_developerportal_credentialbuilder_validate_changed2(inputs)
});
export { developerportal_credentialbuilder_validate_changed2 as "developerPortal.credentialBuilder.validate.changed" }