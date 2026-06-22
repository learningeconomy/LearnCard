/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Oninstall4Inputs */

const en_developerportal_components_launchconfigstep_oninstall4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Oninstall4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`On Install:`)
};

const es_developerportal_components_launchconfigstep_oninstall4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Oninstall4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`On Install:`)
};

const fr_developerportal_components_launchconfigstep_oninstall4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Oninstall4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`On Install:`)
};

const ar_developerportal_components_launchconfigstep_oninstall4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Oninstall4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`On Install:`)
};

/**
* | output |
* | --- |
* | "On Install:" |
*
* @param {Developerportal_Components_Launchconfigstep_Oninstall4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_oninstall4 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Oninstall4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Oninstall4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_oninstall4(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_oninstall4(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_oninstall4(inputs)
	return ar_developerportal_components_launchconfigstep_oninstall4(inputs)
});
export { developerportal_components_launchconfigstep_oninstall4 as "developerPortal.components.launchConfigStep.onInstall" }