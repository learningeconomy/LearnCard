/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Selecttemplatefirst4Inputs */

const en_developerportal_dashboards_tabs_csvupload_selecttemplatefirst4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Selecttemplatefirst4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please select a template first`)
};

const es_developerportal_dashboards_tabs_csvupload_selecttemplatefirst4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Selecttemplatefirst4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor selecciona una plantilla primero`)
};

const fr_developerportal_dashboards_tabs_csvupload_selecttemplatefirst4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Selecttemplatefirst4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez d'abord sélectionner un modèle`)
};

const ar_developerportal_dashboards_tabs_csvupload_selecttemplatefirst4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Selecttemplatefirst4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى تحديد قالب أولاً`)
};

/**
* | output |
* | --- |
* | "Please select a template first" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Selecttemplatefirst4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_selecttemplatefirst4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Selecttemplatefirst4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Selecttemplatefirst4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_selecttemplatefirst4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_selecttemplatefirst4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_selecttemplatefirst4(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_selecttemplatefirst4(inputs)
});
export { developerportal_dashboards_tabs_csvupload_selecttemplatefirst4 as "developerPortal.dashboards.tabs.csvUpload.selectTemplateFirst" }