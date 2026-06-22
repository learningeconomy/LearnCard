/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Reviewstep_Launchconfiguration3Inputs */

const en_developerportal_components_reviewstep_launchconfiguration3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Launchconfiguration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launch Configuration`)
};

const es_developerportal_components_reviewstep_launchconfiguration3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Launchconfiguration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuración de Lanzamiento`)
};

const fr_developerportal_components_reviewstep_launchconfiguration3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Launchconfiguration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuration de Lancement`)
};

const ar_developerportal_components_reviewstep_launchconfiguration3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Launchconfiguration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تكوين الإطلاق`)
};

/**
* | output |
* | --- |
* | "Launch Configuration" |
*
* @param {Developerportal_Components_Reviewstep_Launchconfiguration3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_reviewstep_launchconfiguration3 = /** @type {((inputs?: Developerportal_Components_Reviewstep_Launchconfiguration3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Reviewstep_Launchconfiguration3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_reviewstep_launchconfiguration3(inputs)
	if (locale === "es") return es_developerportal_components_reviewstep_launchconfiguration3(inputs)
	if (locale === "fr") return fr_developerportal_components_reviewstep_launchconfiguration3(inputs)
	return ar_developerportal_components_reviewstep_launchconfiguration3(inputs)
});
export { developerportal_components_reviewstep_launchconfiguration3 as "developerPortal.components.reviewStep.launchConfiguration" }