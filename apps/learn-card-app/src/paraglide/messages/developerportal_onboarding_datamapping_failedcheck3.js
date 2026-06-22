/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Failedcheck3Inputs */

const en_developerportal_onboarding_datamapping_failedcheck3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Failedcheck3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to check credentials. Please try again.`)
};

const es_developerportal_onboarding_datamapping_failedcheck3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Failedcheck3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al verificar las credenciales. Inténtalo de nuevo.`)
};

const fr_developerportal_onboarding_datamapping_failedcheck3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Failedcheck3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la vérification des credentials. Veuillez réessayer.`)
};

const ar_developerportal_onboarding_datamapping_failedcheck3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Failedcheck3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل التحقق من بيانات الاعتماد. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Failed to check credentials. Please try again." |
*
* @param {Developerportal_Onboarding_Datamapping_Failedcheck3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_failedcheck3 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Failedcheck3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Failedcheck3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_failedcheck3(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_failedcheck3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_failedcheck3(inputs)
	return ar_developerportal_onboarding_datamapping_failedcheck3(inputs)
});
export { developerportal_onboarding_datamapping_failedcheck3 as "developerPortal.onboarding.dataMapping.failedCheck" }