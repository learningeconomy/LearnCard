/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Csvcatalogfields4Inputs */

const en_developerportal_onboarding_templatebuilder_csvcatalogfields4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcatalogfields4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Catalog Fields (Baked into each boost)`)
};

const es_developerportal_onboarding_templatebuilder_csvcatalogfields4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcatalogfields4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Campos del Catálogo (Incorporados en cada boost)`)
};

const fr_developerportal_onboarding_templatebuilder_csvcatalogfields4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcatalogfields4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Champs du Catalogue (Intégrés dans chaque boost)`)
};

const ar_developerportal_onboarding_templatebuilder_csvcatalogfields4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcatalogfields4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حقول الكتالوج (مدمجة في كل معزز)`)
};

/**
* | output |
* | --- |
* | "Catalog Fields (Baked into each boost)" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvcatalogfields4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvcatalogfields4 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Csvcatalogfields4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvcatalogfields4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvcatalogfields4(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvcatalogfields4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvcatalogfields4(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvcatalogfields4(inputs)
});
export { developerportal_onboarding_templatebuilder_csvcatalogfields4 as "developerPortal.onboarding.templateBuilder.csvCatalogFields" }