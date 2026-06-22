/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Applistings_Deleteconfirm3Inputs */

const en_developerportal_dashboards_tabs_applistings_deleteconfirm3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Deleteconfirm3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Delete "${i?.name}"? This cannot be undone.`)
};

const es_developerportal_dashboards_tabs_applistings_deleteconfirm3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Deleteconfirm3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`¿Eliminar "${i?.name}"? Esto no se puede deshacer.`)
};

const fr_developerportal_dashboards_tabs_applistings_deleteconfirm3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Deleteconfirm3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Supprimer "${i?.name}" ? Cette action est irréversible.`)
};

const ar_developerportal_dashboards_tabs_applistings_deleteconfirm3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Deleteconfirm3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`حذف "${i?.name}"؟ لا يمكن التراجع عن هذا.`)
};

/**
* | output |
* | --- |
* | "Delete \"{name}\"? This cannot be undone." |
*
* @param {Developerportal_Dashboards_Tabs_Applistings_Deleteconfirm3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_applistings_deleteconfirm3 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Applistings_Deleteconfirm3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Applistings_Deleteconfirm3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_applistings_deleteconfirm3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_applistings_deleteconfirm3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_applistings_deleteconfirm3(inputs)
	return ar_developerportal_dashboards_tabs_applistings_deleteconfirm3(inputs)
});
export { developerportal_dashboards_tabs_applistings_deleteconfirm3 as "developerPortal.dashboards.tabs.appListings.deleteConfirm" }