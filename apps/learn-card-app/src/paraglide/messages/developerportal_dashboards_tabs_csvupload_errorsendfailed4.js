/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Errorsendfailed4Inputs */

const en_developerportal_dashboards_tabs_csvupload_errorsendfailed4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Errorsendfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send failed`)
};

const es_developerportal_dashboards_tabs_csvupload_errorsendfailed4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Errorsendfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envío falló`)
};

const fr_developerportal_dashboards_tabs_csvupload_errorsendfailed4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Errorsendfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de l'envoi`)
};

const ar_developerportal_dashboards_tabs_csvupload_errorsendfailed4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Errorsendfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل الإرسال`)
};

/**
* | output |
* | --- |
* | "Send failed" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Errorsendfailed4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_errorsendfailed4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Errorsendfailed4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Errorsendfailed4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_errorsendfailed4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_errorsendfailed4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_errorsendfailed4(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_errorsendfailed4(inputs)
});
export { developerportal_dashboards_tabs_csvupload_errorsendfailed4 as "developerPortal.dashboards.tabs.csvUpload.errorSendFailed" }