/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Step1title4Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_step1title4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step1title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Step 1: Test Consent Redirect`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_step1title4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step1title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paso 1: Probar Redirección de Consentimiento`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_step1title4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step1title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Étape 1 : Tester la Redirection de Consentement`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_step1title4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step1title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الخطوة 1: اختبار إعادة توجيه الموافقة`)
};

/**
* | output |
* | --- |
* | "Step 1: Test Consent Redirect" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Step1title4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_step1title4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Step1title4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Step1title4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_step1title4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_step1title4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_step1title4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_step1title4(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_step1title4 as "developerPortal.dashboards.tabs.consentFlowTesting.step1Title" }