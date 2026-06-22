/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Coursedataprefilleddesc5Inputs */

const en_developerportal_dashboards_tabs_integrationcode_coursedataprefilleddesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Coursedataprefilleddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This boost has course-specific data (name, credits, etc.) already baked in. You only need to provide issuance data like recipient name and date.`)
};

const es_developerportal_dashboards_tabs_integrationcode_coursedataprefilleddesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Coursedataprefilleddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Este boost tiene datos específicos del curso (nombre, créditos, etc.) ya incorporados. Solo necesitas proporcionar datos de emisión como nombre del destinatario y fecha.`)
};

const fr_developerportal_dashboards_tabs_integrationcode_coursedataprefilleddesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Coursedataprefilleddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ce boost contient déjà des données spécifiques au cours (nom, crédits, etc.). Vous n'avez besoin que de fournir les données d'émission comme le nom du destinataire et la date.`)
};

const ar_developerportal_dashboards_tabs_integrationcode_coursedataprefilleddesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Coursedataprefilleddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يحتوي هذا boost على بيانات خاصة بالدورة (الاسم والساعات المعتمدة إلخ) مضمنة بالفعل. تحتاج فقط إلى توفير بيانات الإصدار مثل اسم المستلم والتاريخ.`)
};

/**
* | output |
* | --- |
* | "This boost has course-specific data (name, credits, etc.) already baked in. You only need to provide issuance data like recipient name and date." |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Coursedataprefilleddesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_coursedataprefilleddesc5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Coursedataprefilleddesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Coursedataprefilleddesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_coursedataprefilleddesc5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_coursedataprefilleddesc5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_coursedataprefilleddesc5(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_coursedataprefilleddesc5(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_coursedataprefilleddesc5 as "developerPortal.dashboards.tabs.integrationCode.courseDataPrefilledDesc" }