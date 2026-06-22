/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Childsave3Inputs */

const en_developerportal_onboarding_templatebuilder_childsave3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Childsave3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save Changes`)
};

const es_developerportal_onboarding_templatebuilder_childsave3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Childsave3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar Cambios`)
};

const fr_developerportal_onboarding_templatebuilder_childsave3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Childsave3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer les Modifications`)
};

const ar_developerportal_onboarding_templatebuilder_childsave3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Childsave3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حفظ التغييرات`)
};

/**
* | output |
* | --- |
* | "Save Changes" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Childsave3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_childsave3 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Childsave3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Childsave3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_childsave3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_childsave3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_childsave3(inputs)
	return ar_developerportal_onboarding_templatebuilder_childsave3(inputs)
});
export { developerportal_onboarding_templatebuilder_childsave3 as "developerPortal.onboarding.templateBuilder.childSave" }