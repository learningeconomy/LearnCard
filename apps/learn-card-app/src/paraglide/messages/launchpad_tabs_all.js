/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Tabs_AllInputs */

const en_launchpad_tabs_all = /** @type {(inputs: Launchpad_Tabs_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All`)
};

const es_launchpad_tabs_all = /** @type {(inputs: Launchpad_Tabs_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todas`)
};

const de_launchpad_tabs_all = /** @type {(inputs: Launchpad_Tabs_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alle`)
};

const ar_launchpad_tabs_all = /** @type {(inputs: Launchpad_Tabs_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الكل`)
};

/**
* | output |
* | --- |
* | "All" |
*
* @param {Launchpad_Tabs_AllInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_tabs_all = /** @type {((inputs?: Launchpad_Tabs_AllInputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Tabs_AllInputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_tabs_all(inputs)
	if (locale === "es") return es_launchpad_tabs_all(inputs)
	if (locale === "de") return de_launchpad_tabs_all(inputs)
	return ar_launchpad_tabs_all(inputs)
});
export { launchpad_tabs_all as "launchpad.tabs.all" }