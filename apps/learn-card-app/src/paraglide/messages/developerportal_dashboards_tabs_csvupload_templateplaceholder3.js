/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Templateplaceholder3Inputs */

const en_developerportal_dashboards_tabs_csvupload_templateplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Templateplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose a credential template...`)
};

const es_developerportal_dashboards_tabs_csvupload_templateplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Templateplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige una plantilla de credencial...`)
};

const fr_developerportal_dashboards_tabs_csvupload_templateplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Templateplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez un modèle de credential...`)
};

const ar_developerportal_dashboards_tabs_csvupload_templateplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Templateplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر قالب بيانات اعتماد...`)
};

/**
* | output |
* | --- |
* | "Choose a credential template..." |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Templateplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_templateplaceholder3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Templateplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Templateplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_templateplaceholder3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_templateplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_templateplaceholder3(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_templateplaceholder3(inputs)
});
export { developerportal_dashboards_tabs_csvupload_templateplaceholder3 as "developerPortal.dashboards.tabs.csvUpload.templatePlaceholder" }