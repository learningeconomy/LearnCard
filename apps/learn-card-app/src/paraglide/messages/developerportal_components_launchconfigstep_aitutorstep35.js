/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Aitutorstep35Inputs */

const en_developerportal_components_launchconfigstep_aitutorstep35 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorstep35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User enters or selects a learning topic`)
};

const es_developerportal_components_launchconfigstep_aitutorstep35 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorstep35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User enters or selects a learning topic`)
};

const fr_developerportal_components_launchconfigstep_aitutorstep35 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorstep35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User enters or selects a learning topic`)
};

const ar_developerportal_components_launchconfigstep_aitutorstep35 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorstep35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User enters or selects a learning topic`)
};

/**
* | output |
* | --- |
* | "User enters or selects a learning topic" |
*
* @param {Developerportal_Components_Launchconfigstep_Aitutorstep35Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_aitutorstep35 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Aitutorstep35Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Aitutorstep35Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_aitutorstep35(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_aitutorstep35(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_aitutorstep35(inputs)
	return ar_developerportal_components_launchconfigstep_aitutorstep35(inputs)
});
export { developerportal_components_launchconfigstep_aitutorstep35 as "developerPortal.components.launchConfigStep.aiTutorStep3" }