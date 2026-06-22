/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Copyurititle4Inputs */

const en_developerportal_onboarding_templatebuilder_copyurititle4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Copyurititle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy template URI`)
};

const es_developerportal_onboarding_templatebuilder_copyurititle4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Copyurititle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar URI de plantilla`)
};

const fr_developerportal_onboarding_templatebuilder_copyurititle4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Copyurititle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier l'URI du modèle`)
};

const ar_developerportal_onboarding_templatebuilder_copyurititle4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Copyurititle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نسخ URI القالب`)
};

/**
* | output |
* | --- |
* | "Copy template URI" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Copyurititle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_copyurititle4 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Copyurititle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Copyurititle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_copyurititle4(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_copyurititle4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_copyurititle4(inputs)
	return ar_developerportal_onboarding_templatebuilder_copyurititle4(inputs)
});
export { developerportal_onboarding_templatebuilder_copyurititle4 as "developerPortal.onboarding.templateBuilder.copyUriTitle" }