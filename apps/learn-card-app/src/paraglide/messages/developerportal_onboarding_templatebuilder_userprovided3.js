/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Userprovided3Inputs */

const en_developerportal_onboarding_templatebuilder_userprovided3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Userprovided3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User-provided at issuance:`)
};

const es_developerportal_onboarding_templatebuilder_userprovided3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Userprovided3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Proporcionado por el usuario al emitir:`)
};

const fr_developerportal_onboarding_templatebuilder_userprovided3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Userprovided3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fourni par l'utilisateur à l'émission :`)
};

const ar_developerportal_onboarding_templatebuilder_userprovided3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Userprovided3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يوفره المستخدم عند الإصدار:`)
};

/**
* | output |
* | --- |
* | "User-provided at issuance:" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Userprovided3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_userprovided3 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Userprovided3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Userprovided3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_userprovided3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_userprovided3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_userprovided3(inputs)
	return ar_developerportal_onboarding_templatebuilder_userprovided3(inputs)
});
export { developerportal_onboarding_templatebuilder_userprovided3 as "developerPortal.onboarding.templateBuilder.userProvided" }