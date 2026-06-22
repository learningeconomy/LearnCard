/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Step3title4Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_step3title4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step3title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Step 3: Send Test Credential`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_step3title4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step3title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paso 3: Enviar Credencial de Prueba`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_step3title4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step3title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Étape 3 : Envoyer un Credential de Test`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_step3title4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step3title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الخطوة 3: إرسال بيانات اعتماد اختبارية`)
};

/**
* | output |
* | --- |
* | "Step 3: Send Test Credential" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Step3title4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_step3title4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Step3title4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Step3title4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_step3title4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_step3title4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_step3title4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_step3title4(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_step3title4 as "developerPortal.dashboards.tabs.consentFlowTesting.step3Title" }