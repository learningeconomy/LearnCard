/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Coursedataprefilledtitle5Inputs */

const en_developerportal_dashboards_tabs_integrationcode_coursedataprefilledtitle5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Coursedataprefilledtitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Course data is pre-filled`)
};

const es_developerportal_dashboards_tabs_integrationcode_coursedataprefilledtitle5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Coursedataprefilledtitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Los datos del curso están predefinidos`)
};

const fr_developerportal_dashboards_tabs_integrationcode_coursedataprefilledtitle5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Coursedataprefilledtitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les données du cours sont pré-remplies`)
};

const ar_developerportal_dashboards_tabs_integrationcode_coursedataprefilledtitle5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Coursedataprefilledtitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بيانات الدورة معبأة مسبقًا`)
};

/**
* | output |
* | --- |
* | "Course data is pre-filled" |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Coursedataprefilledtitle5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_coursedataprefilledtitle5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Coursedataprefilledtitle5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Coursedataprefilledtitle5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_coursedataprefilledtitle5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_coursedataprefilledtitle5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_coursedataprefilledtitle5(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_coursedataprefilledtitle5(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_coursedataprefilledtitle5 as "developerPortal.dashboards.tabs.integrationCode.courseDataPrefilledTitle" }