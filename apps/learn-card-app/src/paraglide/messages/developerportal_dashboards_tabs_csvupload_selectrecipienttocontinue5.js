/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Selectrecipienttocontinue5Inputs */

const en_developerportal_dashboards_tabs_csvupload_selectrecipienttocontinue5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Selectrecipienttocontinue5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please select the recipient column to continue`)
};

const es_developerportal_dashboards_tabs_csvupload_selectrecipienttocontinue5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Selectrecipienttocontinue5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor selecciona la columna de destinatario para continuar`)
};

const fr_developerportal_dashboards_tabs_csvupload_selectrecipienttocontinue5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Selectrecipienttocontinue5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez sélectionner la colonne destinataire pour continuer`)
};

const ar_developerportal_dashboards_tabs_csvupload_selectrecipienttocontinue5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Selectrecipienttocontinue5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى تحديد عمود المستلم للمتابعة`)
};

/**
* | output |
* | --- |
* | "Please select the recipient column to continue" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Selectrecipienttocontinue5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_selectrecipienttocontinue5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Selectrecipienttocontinue5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Selectrecipienttocontinue5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_selectrecipienttocontinue5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_selectrecipienttocontinue5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_selectrecipienttocontinue5(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_selectrecipienttocontinue5(inputs)
});
export { developerportal_dashboards_tabs_csvupload_selectrecipienttocontinue5 as "developerPortal.dashboards.tabs.csvUpload.selectRecipientToContinue" }