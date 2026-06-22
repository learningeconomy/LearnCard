/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Didparamdesc5Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_didparamdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Didparamdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The user's decentralized identifier. Store this to send them credentials later.`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_didparamdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Didparamdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El identificador descentralizado del usuario. Guárdalo para enviarle credenciales después.`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_didparamdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Didparamdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'identifiant décentralisé de l'utilisateur. Stockez-le pour leur envoyer des credentials plus tard.`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_didparamdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Didparamdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المعرف اللامركزي للمستخدم. قم بتخزينه لإرسال بيانات الاعتماد إليهم لاحقًا.`)
};

/**
* | output |
* | --- |
* | "The user's decentralized identifier. Store this to send them credentials later." |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Didparamdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_didparamdesc5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Didparamdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Didparamdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_didparamdesc5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_didparamdesc5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_didparamdesc5(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_didparamdesc5(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_didparamdesc5 as "developerPortal.dashboards.tabs.consentFlowTesting.didParamDesc" }