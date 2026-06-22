/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ column: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Csvupload_Willsendto4Inputs */

const en_developerportal_dashboards_tabs_csvupload_willsendto4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Willsendto4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Will send credentials to values in the "${i?.column}" column`)
};

const es_developerportal_dashboards_tabs_csvupload_willsendto4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Willsendto4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Enviará credenciales a los valores en la columna "${i?.column}"`)
};

const fr_developerportal_dashboards_tabs_csvupload_willsendto4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Willsendto4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Enverra les credentials aux valeurs dans la colonne "${i?.column}"`)
};

const ar_developerportal_dashboards_tabs_csvupload_willsendto4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Willsendto4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`سيتم إرسال بيانات الاعتماد إلى القيم في عمود "${i?.column}"`)
};

/**
* | output |
* | --- |
* | "Will send credentials to values in the \"{column}\" column" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Willsendto4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_willsendto4 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Csvupload_Willsendto4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Willsendto4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_willsendto4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_willsendto4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_willsendto4(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_willsendto4(inputs)
});
export { developerportal_dashboards_tabs_csvupload_willsendto4 as "developerPortal.dashboards.tabs.csvUpload.willSendTo" }