/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Configpreview4Inputs */

const en_developerportal_components_launchconfigstep_configpreview4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Configpreview4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuration Preview`)
};

const es_developerportal_components_launchconfigstep_configpreview4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Configpreview4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista Previa de Configuración`)
};

const fr_developerportal_components_launchconfigstep_configpreview4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Configpreview4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu de la Configuration`)
};

const ar_developerportal_components_launchconfigstep_configpreview4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Configpreview4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة التكوين`)
};

/**
* | output |
* | --- |
* | "Configuration Preview" |
*
* @param {Developerportal_Components_Launchconfigstep_Configpreview4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_configpreview4 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Configpreview4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Configpreview4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_configpreview4(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_configpreview4(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_configpreview4(inputs)
	return ar_developerportal_components_launchconfigstep_configpreview4(inputs)
});
export { developerportal_components_launchconfigstep_configpreview4 as "developerPortal.components.launchConfigStep.configPreview" }