/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedcode_Mycredential3Inputs */

const en_developerportal_dashboards_tabs_embedcode_mycredential3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Mycredential3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`My Credential`)
};

const es_developerportal_dashboards_tabs_embedcode_mycredential3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Mycredential3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[My Credential]`)
};

const fr_developerportal_dashboards_tabs_embedcode_mycredential3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Mycredential3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[My Credential]`)
};

const ar_developerportal_dashboards_tabs_embedcode_mycredential3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Mycredential3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[My Credential]`)
};

/**
* | output |
* | --- |
* | "My Credential" |
*
* @param {Developerportal_Dashboards_Tabs_Embedcode_Mycredential3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedcode_mycredential3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedcode_Mycredential3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedcode_Mycredential3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedcode_mycredential3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedcode_mycredential3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedcode_mycredential3(inputs)
	return ar_developerportal_dashboards_tabs_embedcode_mycredential3(inputs)
});
export { developerportal_dashboards_tabs_embedcode_mycredential3 as "developerPortal.dashboards.tabs.embedCode.myCredential" }