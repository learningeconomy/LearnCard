/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Errorloadfailed3Inputs */

const en_developerportal_dashboards_errorloadfailed3 = /** @type {(inputs: Developerportal_Dashboards_Errorloadfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to load dashboard data`)
};

const es_developerportal_dashboards_errorloadfailed3 = /** @type {(inputs: Developerportal_Dashboards_Errorloadfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al cargar los datos del panel`)
};

const fr_developerportal_dashboards_errorloadfailed3 = /** @type {(inputs: Developerportal_Dashboards_Errorloadfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec du chargement des données du tableau de bord`)
};

const ar_developerportal_dashboards_errorloadfailed3 = /** @type {(inputs: Developerportal_Dashboards_Errorloadfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل تحميل بيانات لوحة البيانات`)
};

/**
* | output |
* | --- |
* | "Failed to load dashboard data" |
*
* @param {Developerportal_Dashboards_Errorloadfailed3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_errorloadfailed3 = /** @type {((inputs?: Developerportal_Dashboards_Errorloadfailed3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Errorloadfailed3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_errorloadfailed3(inputs)
	if (locale === "es") return es_developerportal_dashboards_errorloadfailed3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_errorloadfailed3(inputs)
	return ar_developerportal_dashboards_errorloadfailed3(inputs)
});
export { developerportal_dashboards_errorloadfailed3 as "developerPortal.dashboards.errorLoadFailed" }