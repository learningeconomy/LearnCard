/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedconfig_Livepreviewdesc4Inputs */

const en_developerportal_dashboards_tabs_embedconfig_livepreviewdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Livepreviewdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This is the actual claim button your users will see. Click it to test the full flow.`)
};

const es_developerportal_dashboards_tabs_embedconfig_livepreviewdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Livepreviewdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Este es el botón de reclamo real que verán tus usuarios. Haz clic para probar el flujo completo.`)
};

const fr_developerportal_dashboards_tabs_embedconfig_livepreviewdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Livepreviewdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ceci est le véritable bouton de réclamation que vos utilisateurs verront. Cliquez pour tester le flux complet.`)
};

const ar_developerportal_dashboards_tabs_embedconfig_livepreviewdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Livepreviewdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هذا هو زر المطالبة الفعلي الذي سيراه مستخدميك. انقر لاختبار التدفق الكامل.`)
};

/**
* | output |
* | --- |
* | "This is the actual claim button your users will see. Click it to test the full flow." |
*
* @param {Developerportal_Dashboards_Tabs_Embedconfig_Livepreviewdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedconfig_livepreviewdesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedconfig_Livepreviewdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedconfig_Livepreviewdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedconfig_livepreviewdesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedconfig_livepreviewdesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedconfig_livepreviewdesc4(inputs)
	return ar_developerportal_dashboards_tabs_embedconfig_livepreviewdesc4(inputs)
});
export { developerportal_dashboards_tabs_embedconfig_livepreviewdesc4 as "developerPortal.dashboards.tabs.embedConfig.livePreviewDesc" }