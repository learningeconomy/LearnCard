/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedconfig_Partnernamedesc4Inputs */

const en_developerportal_dashboards_tabs_embedconfig_partnernamedesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Partnernamedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Shown alongside your logo in the claim modal. Not included on the issued credential.`)
};

const es_developerportal_dashboards_tabs_embedconfig_partnernamedesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Partnernamedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se muestra junto a tu logotipo en el modal de reclamo. No se incluye en la credencial emitida.`)
};

const fr_developerportal_dashboards_tabs_embedconfig_partnernamedesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Partnernamedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Affiché à côté de votre logo dans la fenêtre de réclamation. Non inclus sur le credential émis.`)
};

const ar_developerportal_dashboards_tabs_embedconfig_partnernamedesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Partnernamedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يظهر بجانب شعارك في نافذة المطالبة. غير مضمن في بيانات الاعتماد الصادرة.`)
};

/**
* | output |
* | --- |
* | "Shown alongside your logo in the claim modal. Not included on the issued credential." |
*
* @param {Developerportal_Dashboards_Tabs_Embedconfig_Partnernamedesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedconfig_partnernamedesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedconfig_Partnernamedesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedconfig_Partnernamedesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedconfig_partnernamedesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedconfig_partnernamedesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedconfig_partnernamedesc4(inputs)
	return ar_developerportal_dashboards_tabs_embedconfig_partnernamedesc4(inputs)
});
export { developerportal_dashboards_tabs_embedconfig_partnernamedesc4 as "developerPortal.dashboards.tabs.embedConfig.partnerNameDesc" }