/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Validationerrors3Inputs */

const en_developerportal_onboarding_templatebuilder_validationerrors3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Validationerrors3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Template has validation errors. Fix the issues shown above before saving.`)
};

const es_developerportal_onboarding_templatebuilder_validationerrors3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Validationerrors3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La plantilla tiene errores de validación. Corrije los problemas mostrados arriba antes de guardar.`)
};

const fr_developerportal_onboarding_templatebuilder_validationerrors3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Validationerrors3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le modèle comporte des erreurs de validation. Corrigez les problèmes ci-dessus avant d'enregistrer.`)
};

const ar_developerportal_onboarding_templatebuilder_validationerrors3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Validationerrors3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قالب لديه أخطاء التحقق. أصلح المشكلات الموضحة أعلاه قبل الحفظ.`)
};

/**
* | output |
* | --- |
* | "Template has validation errors. Fix the issues shown above before saving." |
*
* @param {Developerportal_Onboarding_Templatebuilder_Validationerrors3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_validationerrors3 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Validationerrors3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Validationerrors3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_validationerrors3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_validationerrors3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_validationerrors3(inputs)
	return ar_developerportal_onboarding_templatebuilder_validationerrors3(inputs)
});
export { developerportal_onboarding_templatebuilder_validationerrors3 as "developerPortal.onboarding.templateBuilder.validationErrors" }