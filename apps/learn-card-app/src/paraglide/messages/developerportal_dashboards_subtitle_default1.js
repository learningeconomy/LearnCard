/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Subtitle_Default1Inputs */

const en_developerportal_dashboards_subtitle_default1 = /** @type {(inputs: Developerportal_Dashboards_Subtitle_Default1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integration Dashboard`)
};

const es_developerportal_dashboards_subtitle_default1 = /** @type {(inputs: Developerportal_Dashboards_Subtitle_Default1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Panel de Integración`)
};

const fr_developerportal_dashboards_subtitle_default1 = /** @type {(inputs: Developerportal_Dashboards_Subtitle_Default1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tableau de bord d'intégration`)
};

const ar_developerportal_dashboards_subtitle_default1 = /** @type {(inputs: Developerportal_Dashboards_Subtitle_Default1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لوحة بيانات التكامل`)
};

/**
* | output |
* | --- |
* | "Integration Dashboard" |
*
* @param {Developerportal_Dashboards_Subtitle_Default1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_subtitle_default1 = /** @type {((inputs?: Developerportal_Dashboards_Subtitle_Default1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Subtitle_Default1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_subtitle_default1(inputs)
	if (locale === "es") return es_developerportal_dashboards_subtitle_default1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_subtitle_default1(inputs)
	return ar_developerportal_dashboards_subtitle_default1(inputs)
});
export { developerportal_dashboards_subtitle_default1 as "developerPortal.dashboards.subtitle.default" }