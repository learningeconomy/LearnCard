/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Unsavedwarning3Inputs */

const en_developerportal_onboarding_templatebuilder_unsavedwarning3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Unsavedwarning3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save or cancel the template you're editing before continuing.`)
};

const es_developerportal_onboarding_templatebuilder_unsavedwarning3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Unsavedwarning3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guarda o cancela la plantilla que estás editando antes de continuar.`)
};

const fr_developerportal_onboarding_templatebuilder_unsavedwarning3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Unsavedwarning3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrez ou annulez le modèle que vous éditez avant de continuer.`)
};

const ar_developerportal_onboarding_templatebuilder_unsavedwarning3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Unsavedwarning3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`احفظ أو ألغ القالب الذي تقوم بتحريره قبل المتابعة.`)
};

/**
* | output |
* | --- |
* | "Save or cancel the template you're editing before continuing." |
*
* @param {Developerportal_Onboarding_Templatebuilder_Unsavedwarning3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_unsavedwarning3 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Unsavedwarning3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Unsavedwarning3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_unsavedwarning3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_unsavedwarning3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_unsavedwarning3(inputs)
	return ar_developerportal_onboarding_templatebuilder_unsavedwarning3(inputs)
});
export { developerportal_onboarding_templatebuilder_unsavedwarning3 as "developerPortal.onboarding.templateBuilder.unsavedWarning" }