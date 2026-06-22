/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Howaitutorworks6Inputs */

const en_developerportal_components_launchconfigstep_howaitutorworks6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Howaitutorworks6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How AI Tutor Launch Works`)
};

const es_developerportal_components_launchconfigstep_howaitutorworks6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Howaitutorworks6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How AI Tutor Launch Works`)
};

const fr_developerportal_components_launchconfigstep_howaitutorworks6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Howaitutorworks6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How AI Tutor Launch Works`)
};

const ar_developerportal_components_launchconfigstep_howaitutorworks6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Howaitutorworks6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How AI Tutor Launch Works`)
};

/**
* | output |
* | --- |
* | "How AI Tutor Launch Works" |
*
* @param {Developerportal_Components_Launchconfigstep_Howaitutorworks6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_howaitutorworks6 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Howaitutorworks6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Howaitutorworks6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_howaitutorworks6(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_howaitutorworks6(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_howaitutorworks6(inputs)
	return ar_developerportal_components_launchconfigstep_howaitutorworks6(inputs)
});
export { developerportal_components_launchconfigstep_howaitutorworks6 as "developerPortal.components.launchConfigStep.howAiTutorWorks" }