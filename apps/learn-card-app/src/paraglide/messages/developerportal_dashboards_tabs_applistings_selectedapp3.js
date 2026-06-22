/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Applistings_Selectedapp3Inputs */

const en_developerportal_dashboards_tabs_applistings_selectedapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Selectedapp3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Selected: ${i?.name}`)
};

const es_developerportal_dashboards_tabs_applistings_selectedapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Selectedapp3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Seleccionada: ${i?.name}`)
};

const fr_developerportal_dashboards_tabs_applistings_selectedapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Selectedapp3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Sélectionnée : ${i?.name}`)
};

const ar_developerportal_dashboards_tabs_applistings_selectedapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Selectedapp3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`المحدد: ${i?.name}`)
};

/**
* | output |
* | --- |
* | "Selected: {name}" |
*
* @param {Developerportal_Dashboards_Tabs_Applistings_Selectedapp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_applistings_selectedapp3 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Applistings_Selectedapp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Applistings_Selectedapp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_applistings_selectedapp3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_applistings_selectedapp3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_applistings_selectedapp3(inputs)
	return ar_developerportal_dashboards_tabs_applistings_selectedapp3(inputs)
});
export { developerportal_dashboards_tabs_applistings_selectedapp3 as "developerPortal.dashboards.tabs.appListings.selectedApp" }