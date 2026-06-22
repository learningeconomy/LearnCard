/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Downloadcsv3Inputs */

const en_developerportal_dashboards_tabs_integrationcode_downloadcsv3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Downloadcsv3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Download CSV Template`)
};

const es_developerportal_dashboards_tabs_integrationcode_downloadcsv3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Downloadcsv3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descargar Plantilla CSV`)
};

const fr_developerportal_dashboards_tabs_integrationcode_downloadcsv3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Downloadcsv3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger le Modèle CSV`)
};

const ar_developerportal_dashboards_tabs_integrationcode_downloadcsv3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Downloadcsv3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تنزيل قالب CSV`)
};

/**
* | output |
* | --- |
* | "Download CSV Template" |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Downloadcsv3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_downloadcsv3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Downloadcsv3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Downloadcsv3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_downloadcsv3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_downloadcsv3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_downloadcsv3(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_downloadcsv3(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_downloadcsv3 as "developerPortal.dashboards.tabs.integrationCode.downloadCsv" }