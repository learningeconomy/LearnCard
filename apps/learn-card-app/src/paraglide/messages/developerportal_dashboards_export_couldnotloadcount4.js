/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Export_Couldnotloadcount4Inputs */

const en_developerportal_dashboards_export_couldnotloadcount4 = /** @type {(inputs: Developerportal_Dashboards_Export_Couldnotloadcount4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Could not load count`)
};

const es_developerportal_dashboards_export_couldnotloadcount4 = /** @type {(inputs: Developerportal_Dashboards_Export_Couldnotloadcount4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo cargar el conteo`)
};

const fr_developerportal_dashboards_export_couldnotloadcount4 = /** @type {(inputs: Developerportal_Dashboards_Export_Couldnotloadcount4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de charger le décompte`)
};

const ar_developerportal_dashboards_export_couldnotloadcount4 = /** @type {(inputs: Developerportal_Dashboards_Export_Couldnotloadcount4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر تحميل العدد`)
};

/**
* | output |
* | --- |
* | "Could not load count" |
*
* @param {Developerportal_Dashboards_Export_Couldnotloadcount4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_export_couldnotloadcount4 = /** @type {((inputs?: Developerportal_Dashboards_Export_Couldnotloadcount4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Export_Couldnotloadcount4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_export_couldnotloadcount4(inputs)
	if (locale === "es") return es_developerportal_dashboards_export_couldnotloadcount4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_export_couldnotloadcount4(inputs)
	return ar_developerportal_dashboards_export_couldnotloadcount4(inputs)
});
export { developerportal_dashboards_export_couldnotloadcount4 as "developerPortal.dashboards.export.couldNotLoadCount" }