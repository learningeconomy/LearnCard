/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchtypestep_Hintaitutor5Inputs */

const en_developerportal_components_launchtypestep_hintaitutor5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintaitutor5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll provide your AI tutor URL. Users will select a topic and launch to your app with their DID and topic.`)
};

const es_developerportal_components_launchtypestep_hintaitutor5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintaitutor5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll provide your AI tutor URL. Users will select a topic and launch to your app with their DID and topic.`)
};

const fr_developerportal_components_launchtypestep_hintaitutor5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintaitutor5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll provide your AI tutor URL. Users will select a topic and launch to your app with their DID and topic.`)
};

const ar_developerportal_components_launchtypestep_hintaitutor5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintaitutor5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll provide your AI tutor URL. Users will select a topic and launch to your app with their DID and topic.`)
};

/**
* | output |
* | --- |
* | "You'll provide your AI tutor URL. Users will select a topic and launch to your app with their DID and topic." |
*
* @param {Developerportal_Components_Launchtypestep_Hintaitutor5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchtypestep_hintaitutor5 = /** @type {((inputs?: Developerportal_Components_Launchtypestep_Hintaitutor5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchtypestep_Hintaitutor5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchtypestep_hintaitutor5(inputs)
	if (locale === "es") return es_developerportal_components_launchtypestep_hintaitutor5(inputs)
	if (locale === "fr") return fr_developerportal_components_launchtypestep_hintaitutor5(inputs)
	return ar_developerportal_components_launchtypestep_hintaitutor5(inputs)
});
export { developerportal_components_launchtypestep_hintaitutor5 as "developerPortal.components.launchTypeStep.hintAiTutor" }