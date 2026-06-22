/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Csvupload_Sendcredentials3Inputs */

const en_developerportal_dashboards_tabs_csvupload_sendcredentials3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Sendcredentials3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Send ${i?.count} Credentials`)
};

const es_developerportal_dashboards_tabs_csvupload_sendcredentials3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Sendcredentials3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Enviar ${i?.count} Credenciales`)
};

const fr_developerportal_dashboards_tabs_csvupload_sendcredentials3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Sendcredentials3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Envoyer ${i?.count} Credentials`)
};

const ar_developerportal_dashboards_tabs_csvupload_sendcredentials3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Sendcredentials3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`إرسال ${i?.count} بيانات اعتماد`)
};

/**
* | output |
* | --- |
* | "Send {count} Credentials" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Sendcredentials3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_sendcredentials3 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Csvupload_Sendcredentials3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Sendcredentials3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_sendcredentials3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_sendcredentials3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_sendcredentials3(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_sendcredentials3(inputs)
});
export { developerportal_dashboards_tabs_csvupload_sendcredentials3 as "developerPortal.dashboards.tabs.csvUpload.sendCredentials" }