/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Tabs_AiInputs */

const en_launchpad_tabs_ai = /** @type {(inputs: Launchpad_Tabs_AiInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI`)
};

const es_launchpad_tabs_ai = /** @type {(inputs: Launchpad_Tabs_AiInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`IA`)
};

const fr_launchpad_tabs_ai = /** @type {(inputs: Launchpad_Tabs_AiInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`IA`)
};

const ar_launchpad_tabs_ai = /** @type {(inputs: Launchpad_Tabs_AiInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "AI" |
*
* @param {Launchpad_Tabs_AiInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_tabs_ai = /** @type {((inputs?: Launchpad_Tabs_AiInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Tabs_AiInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_tabs_ai(inputs)
	if (locale === "es") return es_launchpad_tabs_ai(inputs)
	if (locale === "fr") return fr_launchpad_tabs_ai(inputs)
	return ar_launchpad_tabs_ai(inputs)
});
export { launchpad_tabs_ai as "launchpad.tabs.ai" }