/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Aitutorstep15Inputs */

const en_developerportal_components_launchconfigstep_aitutorstep15 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorstep15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User clicks "Open" on your AI Tutor app`)
};

const es_developerportal_components_launchconfigstep_aitutorstep15 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorstep15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User clicks "Open" on your AI Tutor app`)
};

const fr_developerportal_components_launchconfigstep_aitutorstep15 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorstep15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User clicks "Open" on your AI Tutor app`)
};

const ar_developerportal_components_launchconfigstep_aitutorstep15 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorstep15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User clicks "Open" on your AI Tutor app`)
};

/**
* | output |
* | --- |
* | "User clicks \"Open\" on your AI Tutor app" |
*
* @param {Developerportal_Components_Launchconfigstep_Aitutorstep15Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_aitutorstep15 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Aitutorstep15Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Aitutorstep15Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_aitutorstep15(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_aitutorstep15(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_aitutorstep15(inputs)
	return ar_developerportal_components_launchconfigstep_aitutorstep15(inputs)
});
export { developerportal_components_launchconfigstep_aitutorstep15 as "developerPortal.components.launchConfigStep.aiTutorStep1" }