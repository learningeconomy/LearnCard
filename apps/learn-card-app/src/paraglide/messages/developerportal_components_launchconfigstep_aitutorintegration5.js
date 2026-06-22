/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Aitutorintegration5Inputs */

const en_developerportal_components_launchconfigstep_aitutorintegration5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorintegration5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Tutor Integration`)
};

const es_developerportal_components_launchconfigstep_aitutorintegration5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorintegration5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Tutor Integration`)
};

const fr_developerportal_components_launchconfigstep_aitutorintegration5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorintegration5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Tutor Integration`)
};

const ar_developerportal_components_launchconfigstep_aitutorintegration5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorintegration5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Tutor Integration`)
};

/**
* | output |
* | --- |
* | "AI Tutor Integration" |
*
* @param {Developerportal_Components_Launchconfigstep_Aitutorintegration5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_aitutorintegration5 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Aitutorintegration5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Aitutorintegration5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_aitutorintegration5(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_aitutorintegration5(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_aitutorintegration5(inputs)
	return ar_developerportal_components_launchconfigstep_aitutorintegration5(inputs)
});
export { developerportal_components_launchconfigstep_aitutorintegration5 as "developerPortal.components.launchConfigStep.aiTutorIntegration" }