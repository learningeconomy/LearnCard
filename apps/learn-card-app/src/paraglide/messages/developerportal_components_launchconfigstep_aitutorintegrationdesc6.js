/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Aitutorintegrationdesc6Inputs */

const en_developerportal_components_launchconfigstep_aitutorintegrationdesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorintegrationdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Tutor apps let users select or create learning topics, then launch your tutor app with the topic and user DID for personalized sessions.`)
};

const es_developerportal_components_launchconfigstep_aitutorintegrationdesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorintegrationdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Tutor apps let users select or create learning topics, then launch your tutor app with the topic and user DID for personalized sessions.`)
};

const fr_developerportal_components_launchconfigstep_aitutorintegrationdesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorintegrationdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Tutor apps let users select or create learning topics, then launch your tutor app with the topic and user DID for personalized sessions.`)
};

const ar_developerportal_components_launchconfigstep_aitutorintegrationdesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorintegrationdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Tutor apps let users select or create learning topics, then launch your tutor app with the topic and user DID for personalized sessions.`)
};

/**
* | output |
* | --- |
* | "AI Tutor apps let users select or create learning topics, then launch your tutor app with the topic and user DID for personalized sessions." |
*
* @param {Developerportal_Components_Launchconfigstep_Aitutorintegrationdesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_aitutorintegrationdesc6 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Aitutorintegrationdesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Aitutorintegrationdesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_aitutorintegrationdesc6(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_aitutorintegrationdesc6(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_aitutorintegrationdesc6(inputs)
	return ar_developerportal_components_launchconfigstep_aitutorintegrationdesc6(inputs)
});
export { developerportal_components_launchconfigstep_aitutorintegrationdesc6 as "developerPortal.components.launchConfigStep.aiTutorIntegrationDesc" }