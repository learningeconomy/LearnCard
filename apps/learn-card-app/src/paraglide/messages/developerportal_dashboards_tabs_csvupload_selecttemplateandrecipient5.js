/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Selecttemplateandrecipient5Inputs */

const en_developerportal_dashboards_tabs_csvupload_selecttemplateandrecipient5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Selecttemplateandrecipient5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please select a template, recipient column, and upload a CSV`)
};

const es_developerportal_dashboards_tabs_csvupload_selecttemplateandrecipient5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Selecttemplateandrecipient5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor selecciona una plantilla, columna de destinatario y sube un CSV`)
};

const fr_developerportal_dashboards_tabs_csvupload_selecttemplateandrecipient5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Selecttemplateandrecipient5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez sélectionner un modèle, une colonne destinataire et télécharger un CSV`)
};

const ar_developerportal_dashboards_tabs_csvupload_selecttemplateandrecipient5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Selecttemplateandrecipient5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى تحديد قالب وعمود مستلم وتحميل CSV`)
};

/**
* | output |
* | --- |
* | "Please select a template, recipient column, and upload a CSV" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Selecttemplateandrecipient5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_selecttemplateandrecipient5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Selecttemplateandrecipient5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Selecttemplateandrecipient5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_selecttemplateandrecipient5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_selecttemplateandrecipient5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_selecttemplateandrecipient5(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_selecttemplateandrecipient5(inputs)
});
export { developerportal_dashboards_tabs_csvupload_selecttemplateandrecipient5 as "developerPortal.dashboards.tabs.csvUpload.selectTemplateAndRecipient" }