/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Tipbranding2Inputs */

const en_developerportal_dashboards_tabs_testing_tipbranding2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Tipbranding2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check that branding, credential name, and data appear correctly`)
};

const es_developerportal_dashboards_tabs_testing_tipbranding2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Tipbranding2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifica que la marca, el nombre de la credencial y los datos aparezcan correctamente`)
};

const fr_developerportal_dashboards_tabs_testing_tipbranding2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Tipbranding2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifiez que la marque, le nom du credential et les données apparaissent correctement`)
};

const ar_developerportal_dashboards_tabs_testing_tipbranding2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Tipbranding2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق من ظهور العلامة التجارية واسم بيانات الاعتماد والبيانات بشكل صحيح`)
};

/**
* | output |
* | --- |
* | "Check that branding, credential name, and data appear correctly" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Tipbranding2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_tipbranding2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Tipbranding2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Tipbranding2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_tipbranding2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_tipbranding2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_tipbranding2(inputs)
	return ar_developerportal_dashboards_tabs_testing_tipbranding2(inputs)
});
export { developerportal_dashboards_tabs_testing_tipbranding2 as "developerPortal.dashboards.tabs.testing.tipBranding" }