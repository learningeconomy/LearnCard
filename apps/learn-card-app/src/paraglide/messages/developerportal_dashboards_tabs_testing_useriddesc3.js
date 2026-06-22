/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Useriddesc3Inputs */

const en_developerportal_dashboards_tabs_testing_useriddesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Useriddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The credential will be sent directly to this user's wallet — no email required.`)
};

const es_developerportal_dashboards_tabs_testing_useriddesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Useriddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La credencial se enviará directamente a la billetera de este usuario — no se requiere correo.`)
};

const fr_developerportal_dashboards_tabs_testing_useriddesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Useriddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le credential sera envoyé directement au portefeuille de cet utilisateur — aucun email requis.`)
};

const ar_developerportal_dashboards_tabs_testing_useriddesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Useriddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سيتم إرسال بيانات الاعتماد مباشرة إلى محفظة هذا المستخدم — لا حاجة للبريد الإلكتروني.`)
};

/**
* | output |
* | --- |
* | "The credential will be sent directly to this user's wallet — no email required." |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Useriddesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_useriddesc3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Useriddesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Useriddesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_useriddesc3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_useriddesc3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_useriddesc3(inputs)
	return ar_developerportal_dashboards_tabs_testing_useriddesc3(inputs)
});
export { developerportal_dashboards_tabs_testing_useriddesc3 as "developerPortal.dashboards.tabs.testing.userIdDesc" }