/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Stats_Credentialssent2Inputs */

const en_developerportal_dashboards_stats_credentialssent2 = /** @type {(inputs: Developerportal_Dashboards_Stats_Credentialssent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credentials Sent`)
};

const es_developerportal_dashboards_stats_credentialssent2 = /** @type {(inputs: Developerportal_Dashboards_Stats_Credentialssent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credenciales Enviadas`)
};

const fr_developerportal_dashboards_stats_credentialssent2 = /** @type {(inputs: Developerportal_Dashboards_Stats_Credentialssent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Certificats Envoyés`)
};

const ar_developerportal_dashboards_stats_credentialssent2 = /** @type {(inputs: Developerportal_Dashboards_Stats_Credentialssent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشهادات المرسلة`)
};

/**
* | output |
* | --- |
* | "Credentials Sent" |
*
* @param {Developerportal_Dashboards_Stats_Credentialssent2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_stats_credentialssent2 = /** @type {((inputs?: Developerportal_Dashboards_Stats_Credentialssent2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Stats_Credentialssent2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_stats_credentialssent2(inputs)
	if (locale === "es") return es_developerportal_dashboards_stats_credentialssent2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_stats_credentialssent2(inputs)
	return ar_developerportal_dashboards_stats_credentialssent2(inputs)
});
export { developerportal_dashboards_stats_credentialssent2 as "developerPortal.dashboards.stats.credentialsSent" }