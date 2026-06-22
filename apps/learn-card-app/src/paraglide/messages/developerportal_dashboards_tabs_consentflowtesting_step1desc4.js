/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Step1desc4Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_step1desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step1desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open the consent flow and grant consent as a test user`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_step1desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step1desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abre el flujo de consentimiento y otorga consentimiento como usuario de prueba`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_step1desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step1desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrez le flux de consentement et accordez le consentement en tant qu'utilisateur test`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_step1desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step1desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`افتح تدفق الموافقة وامنح الموافقة كمستخدم اختباري`)
};

/**
* | output |
* | --- |
* | "Open the consent flow and grant consent as a test user" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Step1desc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_step1desc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Step1desc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Step1desc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_step1desc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_step1desc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_step1desc4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_step1desc4(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_step1desc4 as "developerPortal.dashboards.tabs.consentFlowTesting.step1Desc" }