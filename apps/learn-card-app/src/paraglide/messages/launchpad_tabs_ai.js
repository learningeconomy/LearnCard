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

const de_launchpad_tabs_ai = /** @type {(inputs: Launchpad_Tabs_AiInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`KI`)
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
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_tabs_ai = /** @type {((inputs?: Launchpad_Tabs_AiInputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Tabs_AiInputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_tabs_ai(inputs)
	if (locale === "es") return es_launchpad_tabs_ai(inputs)
	if (locale === "de") return de_launchpad_tabs_ai(inputs)
	return ar_launchpad_tabs_ai(inputs)
});
export { launchpad_tabs_ai as "launchpad.tabs.ai" }