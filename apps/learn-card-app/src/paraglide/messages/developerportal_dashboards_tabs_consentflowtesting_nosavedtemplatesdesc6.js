/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Nosavedtemplatesdesc6Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_nosavedtemplatesdesc6 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Nosavedtemplatesdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create and save a credential template in the Templates tab first.`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_nosavedtemplatesdesc6 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Nosavedtemplatesdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Primero crea y guarda una plantilla de credencial en la pestaña Plantillas.`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_nosavedtemplatesdesc6 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Nosavedtemplatesdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez et sauvegardez d'abord un modèle de credential dans l'onglet Modèles.`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_nosavedtemplatesdesc6 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Nosavedtemplatesdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بإنشاء وحفظ قالب بيانات اعتماد أولاً في علامة تبويب القوالب.`)
};

/**
* | output |
* | --- |
* | "Create and save a credential template in the Templates tab first." |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Nosavedtemplatesdesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_nosavedtemplatesdesc6 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Nosavedtemplatesdesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Nosavedtemplatesdesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_nosavedtemplatesdesc6(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_nosavedtemplatesdesc6(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_nosavedtemplatesdesc6(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_nosavedtemplatesdesc6(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_nosavedtemplatesdesc6 as "developerPortal.dashboards.tabs.consentFlowTesting.noSavedTemplatesDesc" }