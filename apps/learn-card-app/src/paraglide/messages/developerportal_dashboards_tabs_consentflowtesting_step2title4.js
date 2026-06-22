/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Step2title4Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_step2title4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step2title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Step 2: Verify Callback Parameters`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_step2title4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step2title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paso 2: Verificar Parámetros de Callback`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_step2title4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step2title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Étape 2 : Vérifier les Paramètres de Callback`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_step2title4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step2title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الخطوة 2: التحقق من معلمات الاستدعاء`)
};

/**
* | output |
* | --- |
* | "Step 2: Verify Callback Parameters" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Step2title4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_step2title4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Step2title4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Step2title4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_step2title4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_step2title4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_step2title4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_step2title4(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_step2title4 as "developerPortal.dashboards.tabs.consentFlowTesting.step2Title" }