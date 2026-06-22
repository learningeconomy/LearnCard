/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Missingconfigdesc5Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_missingconfigdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Missingconfigdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Complete the Build guide to set your contract URI and callback URL.`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_missingconfigdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Missingconfigdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Completa la guía de Build para configurar tu URI de contrato y URL de callback.`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_missingconfigdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Missingconfigdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terminez le guide Build pour définir votre URI de contrat et votre URL de callback.`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_missingconfigdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Missingconfigdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أكمل دليل البناء لتعيين رابط العقد ورابط الاستدعاء الخاصين بك.`)
};

/**
* | output |
* | --- |
* | "Complete the Build guide to set your contract URI and callback URL." |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Missingconfigdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_missingconfigdesc5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Missingconfigdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Missingconfigdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_missingconfigdesc5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_missingconfigdesc5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_missingconfigdesc5(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_missingconfigdesc5(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_missingconfigdesc5 as "developerPortal.dashboards.tabs.consentFlowTesting.missingConfigDesc" }