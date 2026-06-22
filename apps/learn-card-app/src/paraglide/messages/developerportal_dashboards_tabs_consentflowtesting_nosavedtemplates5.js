/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Nosavedtemplates5Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_nosavedtemplates5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Nosavedtemplates5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No saved templates`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_nosavedtemplates5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Nosavedtemplates5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin plantillas guardadas`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_nosavedtemplates5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Nosavedtemplates5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun modèle sauvegardé`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_nosavedtemplates5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Nosavedtemplates5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد قوالب محفوظة`)
};

/**
* | output |
* | --- |
* | "No saved templates" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Nosavedtemplates5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_nosavedtemplates5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Nosavedtemplates5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Nosavedtemplates5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_nosavedtemplates5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_nosavedtemplates5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_nosavedtemplates5(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_nosavedtemplates5(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_nosavedtemplates5 as "developerPortal.dashboards.tabs.consentFlowTesting.noSavedTemplates" }