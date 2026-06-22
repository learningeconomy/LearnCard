/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Skipinstallationdesc5Inputs */

const en_developerportal_components_launchconfigstep_skipinstallationdesc5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Skipinstallationdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`When enabled, users can open the link directly without installing.`)
};

const es_developerportal_components_launchconfigstep_skipinstallationdesc5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Skipinstallationdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`When enabled, users can open the link directly without installing.`)
};

const fr_developerportal_components_launchconfigstep_skipinstallationdesc5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Skipinstallationdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`When enabled, users can open the link directly without installing.`)
};

const ar_developerportal_components_launchconfigstep_skipinstallationdesc5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Skipinstallationdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`When enabled, users can open the link directly without installing.`)
};

/**
* | output |
* | --- |
* | "When enabled, users can open the link directly without installing." |
*
* @param {Developerportal_Components_Launchconfigstep_Skipinstallationdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_skipinstallationdesc5 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Skipinstallationdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Skipinstallationdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_skipinstallationdesc5(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_skipinstallationdesc5(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_skipinstallationdesc5(inputs)
	return ar_developerportal_components_launchconfigstep_skipinstallationdesc5(inputs)
});
export { developerportal_components_launchconfigstep_skipinstallationdesc5 as "developerPortal.components.launchConfigStep.skipInstallationDesc" }