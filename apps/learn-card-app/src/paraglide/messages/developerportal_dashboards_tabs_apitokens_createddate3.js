/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ date: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Apitokens_Createddate3Inputs */

const en_developerportal_dashboards_tabs_apitokens_createddate3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Createddate3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Created ${i?.date}`)
};

const es_developerportal_dashboards_tabs_apitokens_createddate3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Createddate3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Creado ${i?.date}`)
};

const fr_developerportal_dashboards_tabs_apitokens_createddate3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Createddate3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Créé le ${i?.date}`)
};

const ar_developerportal_dashboards_tabs_apitokens_createddate3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Createddate3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تم الإنشاء ${i?.date}`)
};

/**
* | output |
* | --- |
* | "Created {date}" |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Createddate3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_createddate3 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Apitokens_Createddate3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Createddate3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_createddate3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_createddate3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_createddate3(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_createddate3(inputs)
});
export { developerportal_dashboards_tabs_apitokens_createddate3 as "developerPortal.dashboards.tabs.apiTokens.createdDate" }