/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Addblank3Inputs */

const en_developerportal_onboarding_templatebuilder_addblank3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Addblank3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Blank Template`)
};

const es_developerportal_onboarding_templatebuilder_addblank3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Addblank3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregar Plantilla en Blanco`)
};

const fr_developerportal_onboarding_templatebuilder_addblank3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Addblank3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un Modèle Vierge`)
};

const ar_developerportal_onboarding_templatebuilder_addblank3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Addblank3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة قالب فارغ`)
};

/**
* | output |
* | --- |
* | "Add Blank Template" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Addblank3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_addblank3 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Addblank3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Addblank3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_addblank3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_addblank3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_addblank3(inputs)
	return ar_developerportal_onboarding_templatebuilder_addblank3(inputs)
});
export { developerportal_onboarding_templatebuilder_addblank3 as "developerPortal.onboarding.templateBuilder.addBlank" }