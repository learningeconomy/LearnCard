/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Importfromcatalog4Inputs */

const en_developerportal_onboarding_templatebuilder_importfromcatalog4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Importfromcatalog4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Import from Catalog`)
};

const es_developerportal_onboarding_templatebuilder_importfromcatalog4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Importfromcatalog4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importar del Catálogo`)
};

const fr_developerportal_onboarding_templatebuilder_importfromcatalog4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Importfromcatalog4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importer du Catalogue`)
};

const ar_developerportal_onboarding_templatebuilder_importfromcatalog4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Importfromcatalog4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استيراد من الكتالوج`)
};

/**
* | output |
* | --- |
* | "Import from Catalog" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Importfromcatalog4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_importfromcatalog4 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Importfromcatalog4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Importfromcatalog4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_importfromcatalog4(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_importfromcatalog4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_importfromcatalog4(inputs)
	return ar_developerportal_onboarding_templatebuilder_importfromcatalog4(inputs)
});
export { developerportal_onboarding_templatebuilder_importfromcatalog4 as "developerPortal.onboarding.templateBuilder.importFromCatalog" }