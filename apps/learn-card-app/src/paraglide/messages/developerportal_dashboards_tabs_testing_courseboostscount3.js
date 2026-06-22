/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown>, masterCount: NonNullable<unknown>, context: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Testing_Courseboostscount3Inputs */

const en_developerportal_dashboards_tabs_testing_courseboostscount3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Courseboostscount3Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`${i?.count} course boosts available from ${i?.masterCount} master templates`);
	return /** @type {LocalizedString} */ (`${i?.count} course boosts available from ${i?.masterCount} master template`)
	
};

const es_developerportal_dashboards_tabs_testing_courseboostscount3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Courseboostscount3Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`${i?.count} boosts de curso disponibles de ${i?.masterCount} plantillas maestras`);
	return /** @type {LocalizedString} */ (`${i?.count} boost de curso disponibles de ${i?.masterCount} plantilla maestra`)
	
};

const fr_developerportal_dashboards_tabs_testing_courseboostscount3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Courseboostscount3Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`${i?.count} boosts de cours disponibles depuis ${i?.masterCount} modèles maîtres`);
	return /** @type {LocalizedString} */ (`${i?.count} boost de cours disponible depuis ${i?.masterCount} modèle maître`)
	
};

const ar_developerportal_dashboards_tabs_testing_courseboostscount3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Courseboostscount3Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`${i?.count} تعزيزات دورات متاحة من ${i?.masterCount} قوالب رئيسية`);
	return /** @type {LocalizedString} */ (`${i?.count} تعزيز دورة متاح من ${i?.masterCount} قالب رئيسي`)
	
};

/**
* | context | output |
* | --- | --- |
* | "plural" | "{count} course boosts available from {masterCount} master templates" |
* | * | "{count} course boosts available from {masterCount} master template" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Courseboostscount3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_courseboostscount3 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Testing_Courseboostscount3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Courseboostscount3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_courseboostscount3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_courseboostscount3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_courseboostscount3(inputs)
	return ar_developerportal_dashboards_tabs_testing_courseboostscount3(inputs)
});
export { developerportal_dashboards_tabs_testing_courseboostscount3 as "developerPortal.dashboards.tabs.testing.courseBoostsCount" }