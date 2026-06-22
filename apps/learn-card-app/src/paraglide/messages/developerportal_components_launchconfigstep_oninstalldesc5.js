/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Oninstalldesc5Inputs */

const en_developerportal_components_launchconfigstep_oninstalldesc5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Oninstalldesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User will be prompted to consent to the selected contract's permissions.`)
};

const es_developerportal_components_launchconfigstep_oninstalldesc5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Oninstalldesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User will be prompted to consent to the selected contract's permissions.`)
};

const fr_developerportal_components_launchconfigstep_oninstalldesc5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Oninstalldesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User will be prompted to consent to the selected contract's permissions.`)
};

const ar_developerportal_components_launchconfigstep_oninstalldesc5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Oninstalldesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User will be prompted to consent to the selected contract's permissions.`)
};

/**
* | output |
* | --- |
* | "User will be prompted to consent to the selected contract's permissions." |
*
* @param {Developerportal_Components_Launchconfigstep_Oninstalldesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_oninstalldesc5 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Oninstalldesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Oninstalldesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_oninstalldesc5(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_oninstalldesc5(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_oninstalldesc5(inputs)
	return ar_developerportal_components_launchconfigstep_oninstalldesc5(inputs)
});
export { developerportal_components_launchconfigstep_oninstalldesc5 as "developerPortal.components.launchConfigStep.onInstallDesc" }