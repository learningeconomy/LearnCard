/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ filename: NonNullable<unknown> }} Developerportal_Dashboards_Activity_Csvsaved2Inputs */

const en_developerportal_dashboards_activity_csvsaved2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Csvsaved2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`CSV saved to Documents: ${i?.filename}`)
};

const es_developerportal_dashboards_activity_csvsaved2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Csvsaved2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`CSV guardado en Documentos: ${i?.filename}`)
};

const fr_developerportal_dashboards_activity_csvsaved2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Csvsaved2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`CSV enregistré dans Documents : ${i?.filename}`)
};

const ar_developerportal_dashboards_activity_csvsaved2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Csvsaved2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تم حفظ CSV في المستندات: ${i?.filename}`)
};

/**
* | output |
* | --- |
* | "CSV saved to Documents: {filename}" |
*
* @param {Developerportal_Dashboards_Activity_Csvsaved2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_activity_csvsaved2 = /** @type {((inputs: Developerportal_Dashboards_Activity_Csvsaved2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Activity_Csvsaved2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_activity_csvsaved2(inputs)
	if (locale === "es") return es_developerportal_dashboards_activity_csvsaved2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_activity_csvsaved2(inputs)
	return ar_developerportal_dashboards_activity_csvsaved2(inputs)
});
export { developerportal_dashboards_activity_csvsaved2 as "developerPortal.dashboards.activity.csvSaved" }