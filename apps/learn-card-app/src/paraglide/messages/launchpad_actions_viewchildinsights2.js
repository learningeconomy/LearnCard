/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Viewchildinsights2Inputs */

const en_launchpad_actions_viewchildinsights2 = /** @type {(inputs: Launchpad_Actions_Viewchildinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Child Insights`)
};

const es_launchpad_actions_viewchildinsights2 = /** @type {(inputs: Launchpad_Actions_Viewchildinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver información del niño`)
};

const fr_launchpad_actions_viewchildinsights2 = /** @type {(inputs: Launchpad_Actions_Viewchildinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir les analyses de l'enfant`)
};

const ar_launchpad_actions_viewchildinsights2 = /** @type {(inputs: Launchpad_Actions_Viewchildinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض رؤى الطفل`)
};

/**
* | output |
* | --- |
* | "View Child Insights" |
*
* @param {Launchpad_Actions_Viewchildinsights2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_viewchildinsights2 = /** @type {((inputs?: Launchpad_Actions_Viewchildinsights2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Viewchildinsights2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_viewchildinsights2(inputs)
	if (locale === "es") return es_launchpad_actions_viewchildinsights2(inputs)
	if (locale === "fr") return fr_launchpad_actions_viewchildinsights2(inputs)
	return ar_launchpad_actions_viewchildinsights2(inputs)
});
export { launchpad_actions_viewchildinsights2 as "launchpad.actions.viewChildInsights" }