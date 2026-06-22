/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validation_Targetachievementnotfound5Inputs */

const en_developerportal_credentialbuilder_validation_targetachievementnotfound5 = /** @type {(inputs: Developerportal_Credentialbuilder_Validation_Targetachievementnotfound5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Target achievement not found`)
};

const es_developerportal_credentialbuilder_validation_targetachievementnotfound5 = /** @type {(inputs: Developerportal_Credentialbuilder_Validation_Targetachievementnotfound5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Target achievement not found`)
};

const fr_developerportal_credentialbuilder_validation_targetachievementnotfound5 = /** @type {(inputs: Developerportal_Credentialbuilder_Validation_Targetachievementnotfound5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Target achievement not found`)
};

const ar_developerportal_credentialbuilder_validation_targetachievementnotfound5 = /** @type {(inputs: Developerportal_Credentialbuilder_Validation_Targetachievementnotfound5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Target achievement not found`)
};

/**
* | output |
* | --- |
* | "Target achievement not found" |
*
* @param {Developerportal_Credentialbuilder_Validation_Targetachievementnotfound5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validation_targetachievementnotfound5 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validation_Targetachievementnotfound5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validation_Targetachievementnotfound5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validation_targetachievementnotfound5(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validation_targetachievementnotfound5(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validation_targetachievementnotfound5(inputs)
	return ar_developerportal_credentialbuilder_validation_targetachievementnotfound5(inputs)
});
export { developerportal_credentialbuilder_validation_targetachievementnotfound5 as "developerPortal.credentialBuilder.validation.targetAchievementNotFound" }