/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Appurl4Inputs */

const en_developerportal_components_launchconfigstep_appurl4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Appurl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Application URL`)
};

const es_developerportal_components_launchconfigstep_appurl4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Appurl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de Aplicación`)
};

const fr_developerportal_components_launchconfigstep_appurl4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Appurl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de l'Application`)
};

const ar_developerportal_components_launchconfigstep_appurl4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Appurl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط التطبيق`)
};

/**
* | output |
* | --- |
* | "Application URL" |
*
* @param {Developerportal_Components_Launchconfigstep_Appurl4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_appurl4 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Appurl4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Appurl4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_appurl4(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_appurl4(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_appurl4(inputs)
	return ar_developerportal_components_launchconfigstep_appurl4(inputs)
});
export { developerportal_components_launchconfigstep_appurl4 as "developerPortal.components.launchConfigStep.appUrl" }