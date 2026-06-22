/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Templatecreated3Inputs */

const en_developerportal_onboarding_templatebuilder_templatecreated3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Templatecreated3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Template created!`)
};

const es_developerportal_onboarding_templatebuilder_templatecreated3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Templatecreated3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Plantilla creada!`)
};

const fr_developerportal_onboarding_templatebuilder_templatecreated3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Templatecreated3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modèle créé !`)
};

const ar_developerportal_onboarding_templatebuilder_templatecreated3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Templatecreated3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إنشاء القالب!`)
};

/**
* | output |
* | --- |
* | "Template created!" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Templatecreated3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_templatecreated3 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Templatecreated3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Templatecreated3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_templatecreated3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_templatecreated3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_templatecreated3(inputs)
	return ar_developerportal_onboarding_templatebuilder_templatecreated3(inputs)
});
export { developerportal_onboarding_templatebuilder_templatecreated3 as "developerPortal.onboarding.templateBuilder.templateCreated" }