/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Selectapp3Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_selectapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Selectapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select App`)
};

const es_developerportal_dashboards_tabs_partnerconnect_selectapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Selectapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar App`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_selectapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Selectapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner l'App`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_selectapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Selectapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار التطبيق`)
};

/**
* | output |
* | --- |
* | "Select App" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Selectapp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_selectapp3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Selectapp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Selectapp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_selectapp3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_selectapp3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_selectapp3(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_selectapp3(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_selectapp3 as "developerPortal.dashboards.tabs.partnerConnect.selectApp" }