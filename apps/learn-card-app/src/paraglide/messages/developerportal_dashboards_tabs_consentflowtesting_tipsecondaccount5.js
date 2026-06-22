/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Tipsecondaccount5Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_tipsecondaccount5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Tipsecondaccount5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use a second account to test the consent flow as a real user would experience it`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_tipsecondaccount5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Tipsecondaccount5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usa una segunda cuenta para probar el flujo de consentimiento como lo experimentaría un usuario real`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_tipsecondaccount5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Tipsecondaccount5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisez un deuxième compte pour tester le flux de consentement comme un véritable utilisateur`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_tipsecondaccount5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Tipsecondaccount5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدم حسابًا ثانيًا لاختبار تدفق الموافقة كما سيواجهه مستخدم حقيقي`)
};

/**
* | output |
* | --- |
* | "Use a second account to test the consent flow as a real user would experience it" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Tipsecondaccount5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_tipsecondaccount5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Tipsecondaccount5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Tipsecondaccount5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_tipsecondaccount5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_tipsecondaccount5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_tipsecondaccount5(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_tipsecondaccount5(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_tipsecondaccount5 as "developerPortal.dashboards.tabs.consentFlowTesting.tipSecondAccount" }