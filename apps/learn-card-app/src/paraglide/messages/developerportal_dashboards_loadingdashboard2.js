/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Loadingdashboard2Inputs */

const en_developerportal_dashboards_loadingdashboard2 = /** @type {(inputs: Developerportal_Dashboards_Loadingdashboard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading dashboard...`)
};

const es_developerportal_dashboards_loadingdashboard2 = /** @type {(inputs: Developerportal_Dashboards_Loadingdashboard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando panel...`)
};

const fr_developerportal_dashboards_loadingdashboard2 = /** @type {(inputs: Developerportal_Dashboards_Loadingdashboard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement du tableau de bord...`)
};

const ar_developerportal_dashboards_loadingdashboard2 = /** @type {(inputs: Developerportal_Dashboards_Loadingdashboard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ تحميل لوحة البيانات...`)
};

/**
* | output |
* | --- |
* | "Loading dashboard..." |
*
* @param {Developerportal_Dashboards_Loadingdashboard2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_loadingdashboard2 = /** @type {((inputs?: Developerportal_Dashboards_Loadingdashboard2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Loadingdashboard2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_loadingdashboard2(inputs)
	if (locale === "es") return es_developerportal_dashboards_loadingdashboard2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_loadingdashboard2(inputs)
	return ar_developerportal_dashboards_loadingdashboard2(inputs)
});
export { developerportal_dashboards_loadingdashboard2 as "developerPortal.dashboards.loadingDashboard" }