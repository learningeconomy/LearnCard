/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Viewintegrationguide5Inputs */

const en_developerportal_components_launchconfigstep_viewintegrationguide5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Viewintegrationguide5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View integration guide`)
};

const es_developerportal_components_launchconfigstep_viewintegrationguide5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Viewintegrationguide5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver guía de integración`)
};

const fr_developerportal_components_launchconfigstep_viewintegrationguide5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Viewintegrationguide5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir le guide d'intégration`)
};

const ar_developerportal_components_launchconfigstep_viewintegrationguide5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Viewintegrationguide5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض دليل التكامل`)
};

/**
* | output |
* | --- |
* | "View integration guide" |
*
* @param {Developerportal_Components_Launchconfigstep_Viewintegrationguide5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_viewintegrationguide5 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Viewintegrationguide5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Viewintegrationguide5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_viewintegrationguide5(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_viewintegrationguide5(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_viewintegrationguide5(inputs)
	return ar_developerportal_components_launchconfigstep_viewintegrationguide5(inputs)
});
export { developerportal_components_launchconfigstep_viewintegrationguide5 as "developerPortal.components.launchConfigStep.viewIntegrationGuide" }