/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedcode_Sdkreference3Inputs */

const en_developerportal_dashboards_tabs_embedcode_sdkreference3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Sdkreference3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`SDK Reference — InitOptions`)
};

const es_developerportal_dashboards_tabs_embedcode_sdkreference3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Sdkreference3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Referencia del SDK — InitOptions`)
};

const fr_developerportal_dashboards_tabs_embedcode_sdkreference3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Sdkreference3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Référence SDK — InitOptions`)
};

const ar_developerportal_dashboards_tabs_embedcode_sdkreference3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Sdkreference3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مرجع SDK — InitOptions`)
};

/**
* | output |
* | --- |
* | "SDK Reference — InitOptions" |
*
* @param {Developerportal_Dashboards_Tabs_Embedcode_Sdkreference3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedcode_sdkreference3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedcode_Sdkreference3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedcode_Sdkreference3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedcode_sdkreference3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedcode_sdkreference3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedcode_sdkreference3(inputs)
	return ar_developerportal_dashboards_tabs_embedcode_sdkreference3(inputs)
});
export { developerportal_dashboards_tabs_embedcode_sdkreference3 as "developerPortal.dashboards.tabs.embedCode.sdkReference" }