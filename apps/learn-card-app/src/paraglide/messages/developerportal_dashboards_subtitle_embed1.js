/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Subtitle_Embed1Inputs */

const en_developerportal_dashboards_subtitle_embed1 = /** @type {(inputs: Developerportal_Dashboards_Subtitle_Embed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Embed Integration Dashboard`)
};

const es_developerportal_dashboards_subtitle_embed1 = /** @type {(inputs: Developerportal_Dashboards_Subtitle_Embed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Panel de Integración Incrustada`)
};

const fr_developerportal_dashboards_subtitle_embed1 = /** @type {(inputs: Developerportal_Dashboards_Subtitle_Embed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tableau de bord d'intégration intégrée`)
};

const ar_developerportal_dashboards_subtitle_embed1 = /** @type {(inputs: Developerportal_Dashboards_Subtitle_Embed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لوحة بيانات التكامل المضمن`)
};

/**
* | output |
* | --- |
* | "Embed Integration Dashboard" |
*
* @param {Developerportal_Dashboards_Subtitle_Embed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_subtitle_embed1 = /** @type {((inputs?: Developerportal_Dashboards_Subtitle_Embed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Subtitle_Embed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_subtitle_embed1(inputs)
	if (locale === "es") return es_developerportal_dashboards_subtitle_embed1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_subtitle_embed1(inputs)
	return ar_developerportal_dashboards_subtitle_embed1(inputs)
});
export { developerportal_dashboards_subtitle_embed1 as "developerPortal.dashboards.subtitle.embed" }