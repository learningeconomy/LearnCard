/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Tabs_OtherInputs */

const en_launchpad_tabs_other = /** @type {(inputs: Launchpad_Tabs_OtherInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Other`)
};

const es_launchpad_tabs_other = /** @type {(inputs: Launchpad_Tabs_OtherInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Otros`)
};

const fr_launchpad_tabs_other = /** @type {(inputs: Launchpad_Tabs_OtherInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autres`)
};

const ar_launchpad_tabs_other = /** @type {(inputs: Launchpad_Tabs_OtherInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أخرى`)
};

/**
* | output |
* | --- |
* | "Other" |
*
* @param {Launchpad_Tabs_OtherInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_tabs_other = /** @type {((inputs?: Launchpad_Tabs_OtherInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Tabs_OtherInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_tabs_other(inputs)
	if (locale === "es") return es_launchpad_tabs_other(inputs)
	if (locale === "fr") return fr_launchpad_tabs_other(inputs)
	return ar_launchpad_tabs_other(inputs)
});
export { launchpad_tabs_other as "launchpad.tabs.other" }