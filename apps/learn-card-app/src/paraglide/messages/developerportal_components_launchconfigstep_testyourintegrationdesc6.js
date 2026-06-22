/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Testyourintegrationdesc6Inputs */

const en_developerportal_components_launchconfigstep_testyourintegrationdesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Testyourintegrationdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview your app and validate partner-connect API calls`)
};

const es_developerportal_components_launchconfigstep_testyourintegrationdesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Testyourintegrationdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview your app and validate partner-connect API calls`)
};

const fr_developerportal_components_launchconfigstep_testyourintegrationdesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Testyourintegrationdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview your app and validate partner-connect API calls`)
};

const ar_developerportal_components_launchconfigstep_testyourintegrationdesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Testyourintegrationdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview your app and validate partner-connect API calls`)
};

/**
* | output |
* | --- |
* | "Preview your app and validate partner-connect API calls" |
*
* @param {Developerportal_Components_Launchconfigstep_Testyourintegrationdesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_testyourintegrationdesc6 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Testyourintegrationdesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Testyourintegrationdesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_testyourintegrationdesc6(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_testyourintegrationdesc6(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_testyourintegrationdesc6(inputs)
	return ar_developerportal_components_launchconfigstep_testyourintegrationdesc6(inputs)
});
export { developerportal_components_launchconfigstep_testyourintegrationdesc6 as "developerPortal.components.launchConfigStep.testYourIntegrationDesc" }