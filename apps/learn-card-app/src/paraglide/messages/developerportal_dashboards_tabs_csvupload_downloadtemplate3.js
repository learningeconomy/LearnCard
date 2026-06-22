/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Downloadtemplate3Inputs */

const en_developerportal_dashboards_tabs_csvupload_downloadtemplate3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Downloadtemplate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Download Template`)
};

const es_developerportal_dashboards_tabs_csvupload_downloadtemplate3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Downloadtemplate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descargar Plantilla`)
};

const fr_developerportal_dashboards_tabs_csvupload_downloadtemplate3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Downloadtemplate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger le Modèle`)
};

const ar_developerportal_dashboards_tabs_csvupload_downloadtemplate3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Downloadtemplate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تنزيل القالب`)
};

/**
* | output |
* | --- |
* | "Download Template" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Downloadtemplate3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_downloadtemplate3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Downloadtemplate3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Downloadtemplate3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_downloadtemplate3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_downloadtemplate3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_downloadtemplate3(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_downloadtemplate3(inputs)
});
export { developerportal_dashboards_tabs_csvupload_downloadtemplate3 as "developerPortal.dashboards.tabs.csvUpload.downloadTemplate" }