/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Aitutorstep25Inputs */

const en_developerportal_components_launchconfigstep_aitutorstep25 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorstep25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`They select "New Topic" or "Revisit Topic"`)
};

const es_developerportal_components_launchconfigstep_aitutorstep25 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorstep25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`They select "New Topic" or "Revisit Topic"`)
};

const fr_developerportal_components_launchconfigstep_aitutorstep25 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorstep25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`They select "New Topic" or "Revisit Topic"`)
};

const ar_developerportal_components_launchconfigstep_aitutorstep25 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorstep25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`They select "New Topic" or "Revisit Topic"`)
};

/**
* | output |
* | --- |
* | "They select \"New Topic\" or \"Revisit Topic\"" |
*
* @param {Developerportal_Components_Launchconfigstep_Aitutorstep25Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_aitutorstep25 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Aitutorstep25Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Aitutorstep25Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_aitutorstep25(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_aitutorstep25(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_aitutorstep25(inputs)
	return ar_developerportal_components_launchconfigstep_aitutorstep25(inputs)
});
export { developerportal_components_launchconfigstep_aitutorstep25 as "developerPortal.components.launchConfigStep.aiTutorStep2" }