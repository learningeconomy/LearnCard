/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Notsavedyet3Inputs */

const en_developerportal_dashboards_tabs_testing_notsavedyet3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Notsavedyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Not saved yet`)
};

const es_developerportal_dashboards_tabs_testing_notsavedyet3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Notsavedyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no guardada`)
};

const fr_developerportal_dashboards_tabs_testing_notsavedyet3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Notsavedyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pas encore sauvegardé`)
};

const ar_developerportal_dashboards_tabs_testing_notsavedyet3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Notsavedyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم الحفظ بعد`)
};

/**
* | output |
* | --- |
* | "Not saved yet" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Notsavedyet3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_notsavedyet3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Notsavedyet3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Notsavedyet3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_notsavedyet3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_notsavedyet3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_notsavedyet3(inputs)
	return ar_developerportal_dashboards_tabs_testing_notsavedyet3(inputs)
});
export { developerportal_dashboards_tabs_testing_notsavedyet3 as "developerPortal.dashboards.tabs.testing.notSavedYet" }