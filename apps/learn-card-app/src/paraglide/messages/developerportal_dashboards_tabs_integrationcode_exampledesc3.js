/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Exampledesc3Inputs */

const en_developerportal_dashboards_tabs_integrationcode_exampledesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Exampledesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a template to generate example code. Use the Reference tab to get all URIs.`)
};

const es_developerportal_dashboards_tabs_integrationcode_exampledesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Exampledesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona una plantilla para generar código de ejemplo. Usa la pestaña Referencia para obtener todos los URI.`)
};

const fr_developerportal_dashboards_tabs_integrationcode_exampledesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Exampledesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez un modèle pour générer un exemple de code. Utilisez l'onglet Référence pour obtenir tous les URI.`)
};

const ar_developerportal_dashboards_tabs_integrationcode_exampledesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Exampledesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر قالبًا لإنشاء مثال كود. استخدم علامة تبويب المرجع للحصول على جميع الروابط.`)
};

/**
* | output |
* | --- |
* | "Select a template to generate example code. Use the Reference tab to get all URIs." |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Exampledesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_exampledesc3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Exampledesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Exampledesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_exampledesc3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_exampledesc3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_exampledesc3(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_exampledesc3(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_exampledesc3 as "developerPortal.dashboards.tabs.integrationCode.exampleDesc" }