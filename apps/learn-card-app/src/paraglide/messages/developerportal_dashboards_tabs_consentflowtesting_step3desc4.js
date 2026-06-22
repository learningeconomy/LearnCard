/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Step3desc4Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_step3desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step3desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send a credential to the DID you received from the callback`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_step3desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step3desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envía una credencial al DID que recibiste del callback`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_step3desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step3desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyez un credential au DID que vous avez reçu du callback`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_step3desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Step3desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أرسل بيانات اعتماد إلى DID الذي استلمته من الاستدعاء`)
};

/**
* | output |
* | --- |
* | "Send a credential to the DID you received from the callback" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Step3desc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_step3desc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Step3desc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Step3desc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_step3desc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_step3desc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_step3desc4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_step3desc4(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_step3desc4 as "developerPortal.dashboards.tabs.consentFlowTesting.step3Desc" }