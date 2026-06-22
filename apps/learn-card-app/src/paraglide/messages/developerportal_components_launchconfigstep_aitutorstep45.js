/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Aitutorstep45Inputs */

const en_developerportal_components_launchconfigstep_aitutorstep45 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorstep45Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App opens with ?did=...&topic=...`)
};

const es_developerportal_components_launchconfigstep_aitutorstep45 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorstep45Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App opens with ?did=...&topic=...`)
};

const fr_developerportal_components_launchconfigstep_aitutorstep45 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorstep45Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App opens with ?did=...&topic=...`)
};

const ar_developerportal_components_launchconfigstep_aitutorstep45 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorstep45Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App opens with ?did=...&topic=...`)
};

/**
* | output |
* | --- |
* | "App opens with ?did=...&topic=..." |
*
* @param {Developerportal_Components_Launchconfigstep_Aitutorstep45Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_aitutorstep45 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Aitutorstep45Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Aitutorstep45Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_aitutorstep45(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_aitutorstep45(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_aitutorstep45(inputs)
	return ar_developerportal_components_launchconfigstep_aitutorstep45(inputs)
});
export { developerportal_components_launchconfigstep_aitutorstep45 as "developerPortal.components.launchConfigStep.aiTutorStep4" }