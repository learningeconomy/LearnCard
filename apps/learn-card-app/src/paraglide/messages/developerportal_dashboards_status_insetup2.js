/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Status_Insetup2Inputs */

const en_developerportal_dashboards_status_insetup2 = /** @type {(inputs: Developerportal_Dashboards_Status_Insetup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`In Setup`)
};

const es_developerportal_dashboards_status_insetup2 = /** @type {(inputs: Developerportal_Dashboards_Status_Insetup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En Configuración`)
};

const fr_developerportal_dashboards_status_insetup2 = /** @type {(inputs: Developerportal_Dashboards_Status_Insetup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En Configuration`)
};

const ar_developerportal_dashboards_status_insetup2 = /** @type {(inputs: Developerportal_Dashboards_Status_Insetup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قيد الإعداد`)
};

/**
* | output |
* | --- |
* | "In Setup" |
*
* @param {Developerportal_Dashboards_Status_Insetup2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_status_insetup2 = /** @type {((inputs?: Developerportal_Dashboards_Status_Insetup2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Status_Insetup2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_status_insetup2(inputs)
	if (locale === "es") return es_developerportal_dashboards_status_insetup2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_status_insetup2(inputs)
	return ar_developerportal_dashboards_status_insetup2(inputs)
});
export { developerportal_dashboards_status_insetup2 as "developerPortal.dashboards.status.inSetup" }