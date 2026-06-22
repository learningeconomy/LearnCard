/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Sendfailedfallback5Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_sendfailedfallback5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Sendfailedfallback5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to send credential`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_sendfailedfallback5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Sendfailedfallback5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Failed to send credential]`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_sendfailedfallback5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Sendfailedfallback5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Failed to send credential]`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_sendfailedfallback5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Sendfailedfallback5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Failed to send credential]`)
};

/**
* | output |
* | --- |
* | "Failed to send credential" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Sendfailedfallback5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_sendfailedfallback5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Sendfailedfallback5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Sendfailedfallback5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_sendfailedfallback5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_sendfailedfallback5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_sendfailedfallback5(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_sendfailedfallback5(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_sendfailedfallback5 as "developerPortal.dashboards.tabs.consentFlowTesting.sendFailedFallback" }