/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validationerrors_Achievementsuggestions_14Inputs */

const en_developerportal_credentialbuilder_validationerrors_achievementsuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Achievementsuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check that achievement criteria is valid`)
};

const es_developerportal_credentialbuilder_validationerrors_achievementsuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Achievementsuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifica que los criterios del logro sean válidos`)
};

const fr_developerportal_credentialbuilder_validationerrors_achievementsuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Achievementsuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifiez que les critères de la réalisation sont valides`)
};

const ar_developerportal_credentialbuilder_validationerrors_achievementsuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Achievementsuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق من أن معايير الإنجاز صالحة`)
};

/**
* | output |
* | --- |
* | "Check that achievement criteria is valid" |
*
* @param {Developerportal_Credentialbuilder_Validationerrors_Achievementsuggestions_14Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validationerrors_achievementsuggestions_14 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validationerrors_Achievementsuggestions_14Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validationerrors_Achievementsuggestions_14Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validationerrors_achievementsuggestions_14(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validationerrors_achievementsuggestions_14(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validationerrors_achievementsuggestions_14(inputs)
	return ar_developerportal_credentialbuilder_validationerrors_achievementsuggestions_14(inputs)
});
export { developerportal_credentialbuilder_validationerrors_achievementsuggestions_14 as "developerPortal.credentialBuilder.validationErrors.achievementSuggestions.1" }