/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Requestlearnerinsights2Inputs */

const en_launchpad_actions_requestlearnerinsights2 = /** @type {(inputs: Launchpad_Actions_Requestlearnerinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request Learner Insights`)
};

const es_launchpad_actions_requestlearnerinsights2 = /** @type {(inputs: Launchpad_Actions_Requestlearnerinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitar información del estudiante`)
};

const fr_launchpad_actions_requestlearnerinsights2 = /** @type {(inputs: Launchpad_Actions_Requestlearnerinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demander les analyses de l'apprenant`)
};

const ar_launchpad_actions_requestlearnerinsights2 = /** @type {(inputs: Launchpad_Actions_Requestlearnerinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب رؤى المتعلم`)
};

/**
* | output |
* | --- |
* | "Request Learner Insights" |
*
* @param {Launchpad_Actions_Requestlearnerinsights2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_requestlearnerinsights2 = /** @type {((inputs?: Launchpad_Actions_Requestlearnerinsights2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Requestlearnerinsights2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_requestlearnerinsights2(inputs)
	if (locale === "es") return es_launchpad_actions_requestlearnerinsights2(inputs)
	if (locale === "fr") return fr_launchpad_actions_requestlearnerinsights2(inputs)
	return ar_launchpad_actions_requestlearnerinsights2(inputs)
});
export { launchpad_actions_requestlearnerinsights2 as "launchpad.actions.requestLearnerInsights" }