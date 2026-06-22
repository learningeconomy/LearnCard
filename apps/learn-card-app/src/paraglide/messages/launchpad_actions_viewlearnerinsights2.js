/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Viewlearnerinsights2Inputs */

const en_launchpad_actions_viewlearnerinsights2 = /** @type {(inputs: Launchpad_Actions_Viewlearnerinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Learner Insights`)
};

const es_launchpad_actions_viewlearnerinsights2 = /** @type {(inputs: Launchpad_Actions_Viewlearnerinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver información del estudiante`)
};

const fr_launchpad_actions_viewlearnerinsights2 = /** @type {(inputs: Launchpad_Actions_Viewlearnerinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir les analyses de l'apprenant`)
};

const ar_launchpad_actions_viewlearnerinsights2 = /** @type {(inputs: Launchpad_Actions_Viewlearnerinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض رؤى المتعلم`)
};

/**
* | output |
* | --- |
* | "View Learner Insights" |
*
* @param {Launchpad_Actions_Viewlearnerinsights2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_viewlearnerinsights2 = /** @type {((inputs?: Launchpad_Actions_Viewlearnerinsights2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Viewlearnerinsights2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_viewlearnerinsights2(inputs)
	if (locale === "es") return es_launchpad_actions_viewlearnerinsights2(inputs)
	if (locale === "fr") return fr_launchpad_actions_viewlearnerinsights2(inputs)
	return ar_launchpad_actions_viewlearnerinsights2(inputs)
});
export { launchpad_actions_viewlearnerinsights2 as "launchpad.actions.viewLearnerInsights" }