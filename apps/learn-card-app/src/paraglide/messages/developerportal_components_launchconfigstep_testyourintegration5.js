/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Testyourintegration5Inputs */

const en_developerportal_components_launchconfigstep_testyourintegration5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Testyourintegration5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test Your Integration`)
};

const es_developerportal_components_launchconfigstep_testyourintegration5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Testyourintegration5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prueba Tu Integración`)
};

const fr_developerportal_components_launchconfigstep_testyourintegration5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Testyourintegration5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Testez Votre Intégration`)
};

const ar_developerportal_components_launchconfigstep_testyourintegration5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Testyourintegration5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختبر تكاملتك`)
};

/**
* | output |
* | --- |
* | "Test Your Integration" |
*
* @param {Developerportal_Components_Launchconfigstep_Testyourintegration5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_testyourintegration5 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Testyourintegration5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Testyourintegration5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_testyourintegration5(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_testyourintegration5(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_testyourintegration5(inputs)
	return ar_developerportal_components_launchconfigstep_testyourintegration5(inputs)
});
export { developerportal_components_launchconfigstep_testyourintegration5 as "developerPortal.components.launchConfigStep.testYourIntegration" }