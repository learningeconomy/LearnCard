/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Needhelpintegratingdesc6Inputs */

const en_developerportal_components_launchconfigstep_needhelpintegratingdesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Needhelpintegratingdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View step-by-step developer guide with code examples`)
};

const es_developerportal_components_launchconfigstep_needhelpintegratingdesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Needhelpintegratingdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver guía de desarrollador paso a paso con ejemplos de código`)
};

const fr_developerportal_components_launchconfigstep_needhelpintegratingdesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Needhelpintegratingdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consultez le guide développeur étape par étape avec des exemples de code`)
};

const ar_developerportal_components_launchconfigstep_needhelpintegratingdesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Needhelpintegratingdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض دليل المطور خطوة بخطوة مع أمثلة الكود`)
};

/**
* | output |
* | --- |
* | "View step-by-step developer guide with code examples" |
*
* @param {Developerportal_Components_Launchconfigstep_Needhelpintegratingdesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_needhelpintegratingdesc6 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Needhelpintegratingdesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Needhelpintegratingdesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_needhelpintegratingdesc6(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_needhelpintegratingdesc6(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_needhelpintegratingdesc6(inputs)
	return ar_developerportal_components_launchconfigstep_needhelpintegratingdesc6(inputs)
});
export { developerportal_components_launchconfigstep_needhelpintegratingdesc6 as "developerPortal.components.launchConfigStep.needHelpIntegratingDesc" }