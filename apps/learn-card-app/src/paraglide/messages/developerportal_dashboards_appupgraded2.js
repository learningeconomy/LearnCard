/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Appupgraded2Inputs */

const en_developerportal_dashboards_appupgraded2 = /** @type {(inputs: Developerportal_Dashboards_Appupgraded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App upgraded successfully!`)
};

const es_developerportal_dashboards_appupgraded2 = /** @type {(inputs: Developerportal_Dashboards_Appupgraded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Aplicación actualizada exitosamente!`)
};

const fr_developerportal_dashboards_appupgraded2 = /** @type {(inputs: Developerportal_Dashboards_Appupgraded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Application mise à jour avec succès !`)
};

const ar_developerportal_dashboards_appupgraded2 = /** @type {(inputs: Developerportal_Dashboards_Appupgraded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم ترقية التطبيق بنجاح!`)
};

/**
* | output |
* | --- |
* | "App upgraded successfully!" |
*
* @param {Developerportal_Dashboards_Appupgraded2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_appupgraded2 = /** @type {((inputs?: Developerportal_Dashboards_Appupgraded2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Appupgraded2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_appupgraded2(inputs)
	if (locale === "es") return es_developerportal_dashboards_appupgraded2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_appupgraded2(inputs)
	return ar_developerportal_dashboards_appupgraded2(inputs)
});
export { developerportal_dashboards_appupgraded2 as "developerPortal.dashboards.appUpgraded" }