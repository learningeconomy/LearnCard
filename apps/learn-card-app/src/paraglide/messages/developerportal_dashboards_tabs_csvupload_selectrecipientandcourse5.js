/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Selectrecipientandcourse5Inputs */

const en_developerportal_dashboards_tabs_csvupload_selectrecipientandcourse5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Selectrecipientandcourse5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please select recipient and course ID columns`)
};

const es_developerportal_dashboards_tabs_csvupload_selectrecipientandcourse5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Selectrecipientandcourse5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor selecciona las columnas de destinatario e ID de curso`)
};

const fr_developerportal_dashboards_tabs_csvupload_selectrecipientandcourse5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Selectrecipientandcourse5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez sélectionner les colonnes destinataire et ID de cours`)
};

const ar_developerportal_dashboards_tabs_csvupload_selectrecipientandcourse5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Selectrecipientandcourse5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى تحديد أعمدة المستلم ومعرف الدورة`)
};

/**
* | output |
* | --- |
* | "Please select recipient and course ID columns" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Selectrecipientandcourse5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_selectrecipientandcourse5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Selectrecipientandcourse5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Selectrecipientandcourse5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_selectrecipientandcourse5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_selectrecipientandcourse5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_selectrecipientandcourse5(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_selectrecipientandcourse5(inputs)
});
export { developerportal_dashboards_tabs_csvupload_selectrecipientandcourse5 as "developerPortal.dashboards.tabs.csvUpload.selectRecipientAndCourse" }