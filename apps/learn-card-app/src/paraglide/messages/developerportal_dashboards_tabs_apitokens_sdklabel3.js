/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Apitokens_Sdklabel3Inputs */

const en_developerportal_dashboards_tabs_apitokens_sdklabel3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Sdklabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`SDK (Node.js)`)
};

const es_developerportal_dashboards_tabs_apitokens_sdklabel3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Sdklabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`SDK (Node.js)`)
};

const fr_developerportal_dashboards_tabs_apitokens_sdklabel3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Sdklabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`SDK (Node.js)`)
};

const ar_developerportal_dashboards_tabs_apitokens_sdklabel3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Sdklabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`SDK (Node.js)`)
};

/**
* | output |
* | --- |
* | "SDK (Node.js)" |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Sdklabel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_sdklabel3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Apitokens_Sdklabel3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Sdklabel3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_sdklabel3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_sdklabel3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_sdklabel3(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_sdklabel3(inputs)
});
export { developerportal_dashboards_tabs_apitokens_sdklabel3 as "developerPortal.dashboards.tabs.apiTokens.sdkLabel" }