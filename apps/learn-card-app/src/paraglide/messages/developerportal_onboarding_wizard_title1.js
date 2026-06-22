/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Wizard_Title1Inputs */

const en_developerportal_onboarding_wizard_title1 = /** @type {(inputs: Developerportal_Onboarding_Wizard_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Course Catalog Setup`)
};

const es_developerportal_onboarding_wizard_title1 = /** @type {(inputs: Developerportal_Onboarding_Wizard_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuración del Catálogo de Cursos`)
};

const fr_developerportal_onboarding_wizard_title1 = /** @type {(inputs: Developerportal_Onboarding_Wizard_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuration du Catalogue de Cours`)
};

const ar_developerportal_onboarding_wizard_title1 = /** @type {(inputs: Developerportal_Onboarding_Wizard_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعداد كتالوج الدورة`)
};

/**
* | output |
* | --- |
* | "Course Catalog Setup" |
*
* @param {Developerportal_Onboarding_Wizard_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_wizard_title1 = /** @type {((inputs?: Developerportal_Onboarding_Wizard_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Wizard_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_wizard_title1(inputs)
	if (locale === "es") return es_developerportal_onboarding_wizard_title1(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_wizard_title1(inputs)
	return ar_developerportal_onboarding_wizard_title1(inputs)
});
export { developerportal_onboarding_wizard_title1 as "developerPortal.onboarding.wizard.title" }