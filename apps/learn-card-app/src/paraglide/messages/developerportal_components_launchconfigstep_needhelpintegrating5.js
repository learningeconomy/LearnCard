/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Needhelpintegrating5Inputs */

const en_developerportal_components_launchconfigstep_needhelpintegrating5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Needhelpintegrating5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Need help integrating?`)
};

const es_developerportal_components_launchconfigstep_needhelpintegrating5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Needhelpintegrating5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Necesitas ayuda con la integración?`)
};

const fr_developerportal_components_launchconfigstep_needhelpintegrating5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Needhelpintegrating5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Besoin d'aide pour l'intégration ?`)
};

const ar_developerportal_components_launchconfigstep_needhelpintegrating5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Needhelpintegrating5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل تحتاج مساعدة في التكامل؟`)
};

/**
* | output |
* | --- |
* | "Need help integrating?" |
*
* @param {Developerportal_Components_Launchconfigstep_Needhelpintegrating5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_needhelpintegrating5 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Needhelpintegrating5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Needhelpintegrating5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_needhelpintegrating5(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_needhelpintegrating5(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_needhelpintegrating5(inputs)
	return ar_developerportal_components_launchconfigstep_needhelpintegrating5(inputs)
});
export { developerportal_components_launchconfigstep_needhelpintegrating5 as "developerPortal.components.launchConfigStep.needHelpIntegrating" }