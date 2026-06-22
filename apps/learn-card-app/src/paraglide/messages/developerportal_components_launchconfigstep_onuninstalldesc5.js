/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Onuninstalldesc5Inputs */

const en_developerportal_components_launchconfigstep_onuninstalldesc5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Onuninstalldesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consent will be automatically withdrawn.`)
};

const es_developerportal_components_launchconfigstep_onuninstalldesc5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Onuninstalldesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consent will be automatically withdrawn.`)
};

const fr_developerportal_components_launchconfigstep_onuninstalldesc5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Onuninstalldesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consent will be automatically withdrawn.`)
};

const ar_developerportal_components_launchconfigstep_onuninstalldesc5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Onuninstalldesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consent will be automatically withdrawn.`)
};

/**
* | output |
* | --- |
* | "Consent will be automatically withdrawn." |
*
* @param {Developerportal_Components_Launchconfigstep_Onuninstalldesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_onuninstalldesc5 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Onuninstalldesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Onuninstalldesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_onuninstalldesc5(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_onuninstalldesc5(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_onuninstalldesc5(inputs)
	return ar_developerportal_components_launchconfigstep_onuninstalldesc5(inputs)
});
export { developerportal_components_launchconfigstep_onuninstalldesc5 as "developerPortal.components.launchConfigStep.onUninstallDesc" }