/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Onuninstall4Inputs */

const en_developerportal_components_launchconfigstep_onuninstall4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Onuninstall4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`On Uninstall:`)
};

const es_developerportal_components_launchconfigstep_onuninstall4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Onuninstall4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`On Uninstall:`)
};

const fr_developerportal_components_launchconfigstep_onuninstall4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Onuninstall4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`On Uninstall:`)
};

const ar_developerportal_components_launchconfigstep_onuninstall4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Onuninstall4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`On Uninstall:`)
};

/**
* | output |
* | --- |
* | "On Uninstall:" |
*
* @param {Developerportal_Components_Launchconfigstep_Onuninstall4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_onuninstall4 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Onuninstall4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Onuninstall4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_onuninstall4(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_onuninstall4(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_onuninstall4(inputs)
	return ar_developerportal_components_launchconfigstep_onuninstall4(inputs)
});
export { developerportal_components_launchconfigstep_onuninstall4 as "developerPortal.components.launchConfigStep.onUninstall" }