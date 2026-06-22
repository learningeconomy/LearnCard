/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Sendfailedfallback3Inputs */

const en_developerportal_dashboards_tabs_testing_sendfailedfallback3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sendfailedfallback3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to send test credential`)
};

const es_developerportal_dashboards_tabs_testing_sendfailedfallback3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sendfailedfallback3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Failed to send test credential]`)
};

const fr_developerportal_dashboards_tabs_testing_sendfailedfallback3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sendfailedfallback3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Failed to send test credential]`)
};

const ar_developerportal_dashboards_tabs_testing_sendfailedfallback3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sendfailedfallback3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Failed to send test credential]`)
};

/**
* | output |
* | --- |
* | "Failed to send test credential" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Sendfailedfallback3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_sendfailedfallback3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Sendfailedfallback3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Sendfailedfallback3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_sendfailedfallback3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_sendfailedfallback3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_sendfailedfallback3(inputs)
	return ar_developerportal_dashboards_tabs_testing_sendfailedfallback3(inputs)
});
export { developerportal_dashboards_tabs_testing_sendfailedfallback3 as "developerPortal.dashboards.tabs.testing.sendFailedFallback" }