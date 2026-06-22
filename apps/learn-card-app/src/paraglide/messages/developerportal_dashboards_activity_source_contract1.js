/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Activity_Source_Contract1Inputs */

const en_developerportal_dashboards_activity_source_contract1 = /** @type {(inputs: Developerportal_Dashboards_Activity_Source_Contract1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contract`)
};

const es_developerportal_dashboards_activity_source_contract1 = /** @type {(inputs: Developerportal_Dashboards_Activity_Source_Contract1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contrato`)
};

const fr_developerportal_dashboards_activity_source_contract1 = /** @type {(inputs: Developerportal_Dashboards_Activity_Source_Contract1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contrat`)
};

const ar_developerportal_dashboards_activity_source_contract1 = /** @type {(inputs: Developerportal_Dashboards_Activity_Source_Contract1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عقد`)
};

/**
* | output |
* | --- |
* | "Contract" |
*
* @param {Developerportal_Dashboards_Activity_Source_Contract1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_activity_source_contract1 = /** @type {((inputs?: Developerportal_Dashboards_Activity_Source_Contract1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Activity_Source_Contract1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_activity_source_contract1(inputs)
	if (locale === "es") return es_developerportal_dashboards_activity_source_contract1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_activity_source_contract1(inputs)
	return ar_developerportal_dashboards_activity_source_contract1(inputs)
});
export { developerportal_dashboards_activity_source_contract1 as "developerPortal.dashboards.activity.source.contract" }