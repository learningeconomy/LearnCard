/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Csvimporttitle4Inputs */

const en_developerportal_onboarding_templatebuilder_csvimporttitle4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvimporttitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Import Course Catalog`)
};

const es_developerportal_onboarding_templatebuilder_csvimporttitle4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvimporttitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importar Catálogo de Cursos`)
};

const fr_developerportal_onboarding_templatebuilder_csvimporttitle4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvimporttitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importer un Catalogue de Cours`)
};

const ar_developerportal_onboarding_templatebuilder_csvimporttitle4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvimporttitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استيراد كتالوج الدورة`)
};

/**
* | output |
* | --- |
* | "Import Course Catalog" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvimporttitle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvimporttitle4 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Csvimporttitle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvimporttitle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvimporttitle4(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvimporttitle4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvimporttitle4(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvimporttitle4(inputs)
});
export { developerportal_onboarding_templatebuilder_csvimporttitle4 as "developerPortal.onboarding.templateBuilder.csvImportTitle" }