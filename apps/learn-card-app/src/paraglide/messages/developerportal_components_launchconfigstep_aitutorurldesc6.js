/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Aitutorurldesc6Inputs */

const en_developerportal_components_launchconfigstep_aitutorurldesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorurldesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Users will be redirected to`)
};

const es_developerportal_components_launchconfigstep_aitutorurldesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorurldesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Users will be redirected to`)
};

const fr_developerportal_components_launchconfigstep_aitutorurldesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorurldesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Users will be redirected to`)
};

const ar_developerportal_components_launchconfigstep_aitutorurldesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorurldesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Users will be redirected to`)
};

/**
* | output |
* | --- |
* | "Users will be redirected to" |
*
* @param {Developerportal_Components_Launchconfigstep_Aitutorurldesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_aitutorurldesc6 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Aitutorurldesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Aitutorurldesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_aitutorurldesc6(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_aitutorurldesc6(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_aitutorurldesc6(inputs)
	return ar_developerportal_components_launchconfigstep_aitutorurldesc6(inputs)
});
export { developerportal_components_launchconfigstep_aitutorurldesc6 as "developerPortal.components.launchConfigStep.aiTutorUrlDesc" }