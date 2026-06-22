/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Cancel2Inputs */

const en_developerportal_onboarding_templatebuilder_cancel2 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Cancel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancel`)
};

const es_developerportal_onboarding_templatebuilder_cancel2 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Cancel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancelar`)
};

const fr_developerportal_onboarding_templatebuilder_cancel2 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Cancel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Annuler`)
};

const ar_developerportal_onboarding_templatebuilder_cancel2 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Cancel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء`)
};

/**
* | output |
* | --- |
* | "Cancel" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Cancel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_cancel2 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Cancel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Cancel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_cancel2(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_cancel2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_cancel2(inputs)
	return ar_developerportal_onboarding_templatebuilder_cancel2(inputs)
});
export { developerportal_onboarding_templatebuilder_cancel2 as "developerPortal.onboarding.templateBuilder.cancel" }