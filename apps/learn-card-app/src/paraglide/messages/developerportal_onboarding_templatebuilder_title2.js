/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Title2Inputs */

const en_developerportal_onboarding_templatebuilder_title2 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Credential Templates`)
};

const es_developerportal_onboarding_templatebuilder_title2 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Plantillas de Credenciales`)
};

const fr_developerportal_onboarding_templatebuilder_title2 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer des Modèles de Credentials`)
};

const ar_developerportal_onboarding_templatebuilder_title2 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء قوالب بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Create Credential Templates" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Title2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_title2 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Title2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Title2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_title2(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_title2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_title2(inputs)
	return ar_developerportal_onboarding_templatebuilder_title2(inputs)
});
export { developerportal_onboarding_templatebuilder_title2 as "developerPortal.onboarding.templateBuilder.title" }