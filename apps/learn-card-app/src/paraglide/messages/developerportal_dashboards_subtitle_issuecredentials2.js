/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Subtitle_Issuecredentials2Inputs */

const en_developerportal_dashboards_subtitle_issuecredentials2 = /** @type {(inputs: Developerportal_Dashboards_Subtitle_Issuecredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue Credentials Dashboard`)
};

const es_developerportal_dashboards_subtitle_issuecredentials2 = /** @type {(inputs: Developerportal_Dashboards_Subtitle_Issuecredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Panel de Emisión de Credenciales`)
};

const fr_developerportal_dashboards_subtitle_issuecredentials2 = /** @type {(inputs: Developerportal_Dashboards_Subtitle_Issuecredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tableau de bord d'émission de certificats`)
};

const ar_developerportal_dashboards_subtitle_issuecredentials2 = /** @type {(inputs: Developerportal_Dashboards_Subtitle_Issuecredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لوحة بيانات إصدار الشهادات`)
};

/**
* | output |
* | --- |
* | "Issue Credentials Dashboard" |
*
* @param {Developerportal_Dashboards_Subtitle_Issuecredentials2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_subtitle_issuecredentials2 = /** @type {((inputs?: Developerportal_Dashboards_Subtitle_Issuecredentials2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Subtitle_Issuecredentials2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_subtitle_issuecredentials2(inputs)
	if (locale === "es") return es_developerportal_dashboards_subtitle_issuecredentials2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_subtitle_issuecredentials2(inputs)
	return ar_developerportal_dashboards_subtitle_issuecredentials2(inputs)
});
export { developerportal_dashboards_subtitle_issuecredentials2 as "developerPortal.dashboards.subtitle.issueCredentials" }