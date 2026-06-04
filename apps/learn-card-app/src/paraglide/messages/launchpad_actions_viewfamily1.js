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

const de_launchpad_actions_viewfamily1 = /** @type {(inputs: Launchpad_Actions_Viewfamily1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Familie anzeigen`)
};

const ar_launchpad_actions_viewfamily1 = /** @type {(inputs: Launchpad_Actions_Viewfamily1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض العائلة`)
};

const fr_launchpad_actions_viewfamily1 = /** @type {(inputs: Launchpad_Actions_Viewfamily1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir la famille`)
};

const ko_launchpad_actions_viewfamily1 = /** @type {(inputs: Launchpad_Actions_Viewfamily1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`가족 보기`)
};

/**
* | output |
* | --- |
* | "View Family" |
*
* @param {Launchpad_Actions_Viewfamily1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_viewfamily1 = /** @type {((inputs?: Launchpad_Actions_Viewfamily1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Viewfamily1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_viewfamily1(inputs)
	if (locale === "es") return es_launchpad_actions_viewfamily1(inputs)
	if (locale === "de") return de_launchpad_actions_viewfamily1(inputs)
	if (locale === "ar") return ar_launchpad_actions_viewfamily1(inputs)
	if (locale === "fr") return fr_launchpad_actions_viewfamily1(inputs)
	return ko_launchpad_actions_viewfamily1(inputs)
});
export { launchpad_actions_viewfamily1 as "launchpad.actions.viewFamily" }