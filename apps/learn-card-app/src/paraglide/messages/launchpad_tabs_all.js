/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Tabs_AllInputs */

const en_launchpad_tabs_all = /** @type {(inputs: Launchpad_Tabs_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All`)
};

const es_launchpad_tabs_all = /** @type {(inputs: Launchpad_Tabs_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todos`)
};

const de_launchpad_tabs_all = /** @type {(inputs: Launchpad_Tabs_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alle`)
};

const ar_launchpad_tabs_all = /** @type {(inputs: Launchpad_Tabs_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الكل`)
};

const fr_launchpad_tabs_all = /** @type {(inputs: Launchpad_Tabs_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout`)
};

const ko_launchpad_tabs_all = /** @type {(inputs: Launchpad_Tabs_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`전체`)
};

/**
* | output |
* | --- |
* | "All" |
*
* @param {Launchpad_Tabs_AllInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_tabs_all = /** @type {((inputs?: Launchpad_Tabs_AllInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Tabs_AllInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_tabs_all(inputs)
	if (locale === "es") return es_launchpad_tabs_all(inputs)
	if (locale === "de") return de_launchpad_tabs_all(inputs)
	if (locale === "ar") return ar_launchpad_tabs_all(inputs)
	if (locale === "fr") return fr_launchpad_tabs_all(inputs)
	return ko_launchpad_tabs_all(inputs)
});
export { launchpad_tabs_all as "launchpad.tabs.all" }