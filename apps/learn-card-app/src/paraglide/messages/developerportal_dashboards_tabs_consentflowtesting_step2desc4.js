/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Step2desc4Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_step2desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step2desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`After consent, check that your callback received these parameters`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_step2desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step2desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Después del consentimiento, verifica que tu callback recibió estos parámetros`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_step2desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step2desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Après le consentement, vérifiez que votre callback a reçu ces paramètres`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_step2desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step2desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بعد الموافقة، تحقق من أن الاستدعاء الخاص بك استلم هذه المعلمات`)
};

/**
* | output |
* | --- |
* | "After consent, check that your callback received these parameters" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Step2desc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_step2desc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Step2desc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Step2desc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_step2desc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_step2desc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_step2desc4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_step2desc4(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_step2desc4 as "developerPortal.dashboards.tabs.consentFlowTesting.step2Desc" }