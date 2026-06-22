/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Tabs_PluginsInputs */

const en_launchpad_tabs_plugins = /** @type {(inputs: Launchpad_Tabs_PluginsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plugins`)
};

const es_launchpad_tabs_plugins = /** @type {(inputs: Launchpad_Tabs_PluginsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plugins`)
};

const fr_launchpad_tabs_plugins = /** @type {(inputs: Launchpad_Tabs_PluginsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Extensions`)
};

const ar_launchpad_tabs_plugins = /** @type {(inputs: Launchpad_Tabs_PluginsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإضافات`)
};

/**
* | output |
* | --- |
* | "Plugins" |
*
* @param {Launchpad_Tabs_PluginsInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_tabs_plugins = /** @type {((inputs?: Launchpad_Tabs_PluginsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Tabs_PluginsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_tabs_plugins(inputs)
	if (locale === "es") return es_launchpad_tabs_plugins(inputs)
	if (locale === "fr") return fr_launchpad_tabs_plugins(inputs)
	return ar_launchpad_tabs_plugins(inputs)
});
export { launchpad_tabs_plugins as "launchpad.tabs.plugins" }