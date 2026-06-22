/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Childvalidated3Inputs */

const en_developerportal_onboarding_templatebuilder_childvalidated3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Childvalidated3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential validated successfully`)
};

const es_developerportal_onboarding_templatebuilder_childvalidated3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Childvalidated3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credencial validada exitosamente`)
};

const fr_developerportal_onboarding_templatebuilder_childvalidated3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Childvalidated3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential validé avec succès`)
};

const ar_developerportal_onboarding_templatebuilder_childvalidated3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Childvalidated3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم التحقق من بيانات الاعتماد بنجاح`)
};

/**
* | output |
* | --- |
* | "Credential validated successfully" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Childvalidated3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_childvalidated3 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Childvalidated3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Childvalidated3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_childvalidated3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_childvalidated3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_childvalidated3(inputs)
	return ar_developerportal_onboarding_templatebuilder_childvalidated3(inputs)
});
export { developerportal_onboarding_templatebuilder_childvalidated3 as "developerPortal.onboarding.templateBuilder.childValidated" }