/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Appupgradefailed3Inputs */

const en_developerportal_dashboards_appupgradefailed3 = /** @type {(inputs: Developerportal_Dashboards_Appupgradefailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to upgrade app`)
};

const es_developerportal_dashboards_appupgradefailed3 = /** @type {(inputs: Developerportal_Dashboards_Appupgradefailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al actualizar la aplicación`)
};

const fr_developerportal_dashboards_appupgradefailed3 = /** @type {(inputs: Developerportal_Dashboards_Appupgradefailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la mise à jour de l'application`)
};

const ar_developerportal_dashboards_appupgradefailed3 = /** @type {(inputs: Developerportal_Dashboards_Appupgradefailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل ترقية التطبيق`)
};

/**
* | output |
* | --- |
* | "Failed to upgrade app" |
*
* @param {Developerportal_Dashboards_Appupgradefailed3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_appupgradefailed3 = /** @type {((inputs?: Developerportal_Dashboards_Appupgradefailed3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Appupgradefailed3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_appupgradefailed3(inputs)
	if (locale === "es") return es_developerportal_dashboards_appupgradefailed3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_appupgradefailed3(inputs)
	return ar_developerportal_dashboards_appupgradefailed3(inputs)
});
export { developerportal_dashboards_appupgradefailed3 as "developerPortal.dashboards.appUpgradeFailed" }