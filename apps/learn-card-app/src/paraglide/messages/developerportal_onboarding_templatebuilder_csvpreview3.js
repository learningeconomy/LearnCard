/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Csvpreview3Inputs */

const en_developerportal_onboarding_templatebuilder_csvpreview3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvpreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview: First 3 Boosts to Create`)
};

const es_developerportal_onboarding_templatebuilder_csvpreview3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvpreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista Previa: Primeros 3 Boosts a Crear`)
};

const fr_developerportal_onboarding_templatebuilder_csvpreview3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvpreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu : 3 Premiers Boosts à Créer`)
};

const ar_developerportal_onboarding_templatebuilder_csvpreview3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvpreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة: أول 3 معززات سيتم إنشاؤها`)
};

/**
* | output |
* | --- |
* | "Preview: First 3 Boosts to Create" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvpreview3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvpreview3 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Csvpreview3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvpreview3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvpreview3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvpreview3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvpreview3(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvpreview3(inputs)
});
export { developerportal_onboarding_templatebuilder_csvpreview3 as "developerPortal.onboarding.templateBuilder.csvPreview" }