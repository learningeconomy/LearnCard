/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Childfixvalidation4Inputs */

const en_developerportal_onboarding_templatebuilder_childfixvalidation4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Childfixvalidation4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fix validation errors before saving`)
};

const es_developerportal_onboarding_templatebuilder_childfixvalidation4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Childfixvalidation4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Corrige los errores de validación antes de guardar`)
};

const fr_developerportal_onboarding_templatebuilder_childfixvalidation4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Childfixvalidation4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Corrigez les erreurs de validation avant d'enregistrer`)
};

const ar_developerportal_onboarding_templatebuilder_childfixvalidation4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Childfixvalidation4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أصلح أخطاء التحقق قبل الحفظ`)
};

/**
* | output |
* | --- |
* | "Fix validation errors before saving" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Childfixvalidation4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_childfixvalidation4 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Childfixvalidation4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Childfixvalidation4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_childfixvalidation4(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_childfixvalidation4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_childfixvalidation4(inputs)
	return ar_developerportal_onboarding_templatebuilder_childfixvalidation4(inputs)
});
export { developerportal_onboarding_templatebuilder_childfixvalidation4 as "developerPortal.onboarding.templateBuilder.childFixValidation" }