/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Viewfamily1Inputs */

const en_launchpad_actions_viewfamily1 = /** @type {(inputs: Launchpad_Actions_Viewfamily1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Family`)
};

const es_launchpad_actions_viewfamily1 = /** @type {(inputs: Launchpad_Actions_Viewfamily1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver familia`)
};

const fr_launchpad_actions_viewfamily1 = /** @type {(inputs: Launchpad_Actions_Viewfamily1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir la famille`)
};

const ar_launchpad_actions_viewfamily1 = /** @type {(inputs: Launchpad_Actions_Viewfamily1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض العائلة`)
};

/**
* | output |
* | --- |
* | "View Family" |
*
* @param {Launchpad_Actions_Viewfamily1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_viewfamily1 = /** @type {((inputs?: Launchpad_Actions_Viewfamily1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Viewfamily1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_viewfamily1(inputs)
	if (locale === "es") return es_launchpad_actions_viewfamily1(inputs)
	if (locale === "fr") return fr_launchpad_actions_viewfamily1(inputs)
	return ar_launchpad_actions_viewfamily1(inputs)
});
export { launchpad_actions_viewfamily1 as "launchpad.actions.viewFamily" }