/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validationerrors_Achievementsuggestions_04Inputs */

const en_developerportal_credentialbuilder_validationerrors_achievementsuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Achievementsuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify achievement name and description are set`)
};

const es_developerportal_credentialbuilder_validationerrors_achievementsuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Achievementsuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifica que el nombre y la descripción del logro estén configurados`)
};

const fr_developerportal_credentialbuilder_validationerrors_achievementsuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Achievementsuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifiez que le nom et la description de la réalisation sont définis`)
};

const ar_developerportal_credentialbuilder_validationerrors_achievementsuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Achievementsuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق من تعيين اسم ووصف الإنجاز`)
};

/**
* | output |
* | --- |
* | "Verify achievement name and description are set" |
*
* @param {Developerportal_Credentialbuilder_Validationerrors_Achievementsuggestions_04Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validationerrors_achievementsuggestions_04 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validationerrors_Achievementsuggestions_04Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validationerrors_Achievementsuggestions_04Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validationerrors_achievementsuggestions_04(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validationerrors_achievementsuggestions_04(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validationerrors_achievementsuggestions_04(inputs)
	return ar_developerportal_credentialbuilder_validationerrors_achievementsuggestions_04(inputs)
});
export { developerportal_credentialbuilder_validationerrors_achievementsuggestions_04 as "developerPortal.credentialBuilder.validationErrors.achievementSuggestions.0" }