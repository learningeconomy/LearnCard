/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowcode_Copyuri4Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_copyuri4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Copyuri4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy URI`)
};

const es_developerportal_dashboards_tabs_consentflowcode_copyuri4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Copyuri4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar URI`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_copyuri4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Copyuri4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier l'URI`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_copyuri4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Copyuri4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نسخ الرابط`)
};

/**
* | output |
* | --- |
* | "Copy URI" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Copyuri4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_copyuri4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowcode_Copyuri4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Copyuri4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_copyuri4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_copyuri4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_copyuri4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_copyuri4(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_copyuri4 as "developerPortal.dashboards.tabs.consentFlowCode.copyUri" }