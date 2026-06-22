/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Status_Active1Inputs */

const en_developerportal_dashboards_status_active1 = /** @type {(inputs: Developerportal_Dashboards_Status_Active1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Active`)
};

const es_developerportal_dashboards_status_active1 = /** @type {(inputs: Developerportal_Dashboards_Status_Active1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activo`)
};

const fr_developerportal_dashboards_status_active1 = /** @type {(inputs: Developerportal_Dashboards_Status_Active1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actif`)
};

const ar_developerportal_dashboards_status_active1 = /** @type {(inputs: Developerportal_Dashboards_Status_Active1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نشط`)
};

/**
* | output |
* | --- |
* | "Active" |
*
* @param {Developerportal_Dashboards_Status_Active1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_status_active1 = /** @type {((inputs?: Developerportal_Dashboards_Status_Active1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Status_Active1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_status_active1(inputs)
	if (locale === "es") return es_developerportal_dashboards_status_active1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_status_active1(inputs)
	return ar_developerportal_dashboards_status_active1(inputs)
});
export { developerportal_dashboards_status_active1 as "developerPortal.dashboards.status.active" }