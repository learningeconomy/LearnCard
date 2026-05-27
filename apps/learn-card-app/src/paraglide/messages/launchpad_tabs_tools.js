/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Tabs_ToolsInputs */

const en_launchpad_tabs_tools = /** @type {(inputs: Launchpad_Tabs_ToolsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tools`)
};

const es_launchpad_tabs_tools = /** @type {(inputs: Launchpad_Tabs_ToolsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Herramientas`)
};

const de_launchpad_tabs_tools = /** @type {(inputs: Launchpad_Tabs_ToolsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Werkzeuge`)
};

const ar_launchpad_tabs_tools = /** @type {(inputs: Launchpad_Tabs_ToolsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الأدوات`)
};

/**
* | output |
* | --- |
* | "Tools" |
*
* @param {Launchpad_Tabs_ToolsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_tabs_tools = /** @type {((inputs?: Launchpad_Tabs_ToolsInputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Tabs_ToolsInputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_tabs_tools(inputs)
	if (locale === "es") return es_launchpad_tabs_tools(inputs)
	if (locale === "de") return de_launchpad_tabs_tools(inputs)
	return ar_launchpad_tabs_tools(inputs)
});
export { launchpad_tabs_tools as "launchpad.tabs.tools" }