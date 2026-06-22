/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Skillprofile_Skip1Inputs */

const en_dashboard_skillprofile_skip1 = /** @type {(inputs: Dashboard_Skillprofile_Skip1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skip`)
};

const es_dashboard_skillprofile_skip1 = /** @type {(inputs: Dashboard_Skillprofile_Skip1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Omitir`)
};

const fr_dashboard_skillprofile_skip1 = /** @type {(inputs: Dashboard_Skillprofile_Skip1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passer`)
};

const ar_dashboard_skillprofile_skip1 = /** @type {(inputs: Dashboard_Skillprofile_Skip1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تخطٍّ`)
};

/**
* | output |
* | --- |
* | "Skip" |
*
* @param {Dashboard_Skillprofile_Skip1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_skillprofile_skip1 = /** @type {((inputs?: Dashboard_Skillprofile_Skip1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Skillprofile_Skip1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_skillprofile_skip1(inputs)
	if (locale === "es") return es_dashboard_skillprofile_skip1(inputs)
	if (locale === "fr") return fr_dashboard_skillprofile_skip1(inputs)
	return ar_dashboard_skillprofile_skip1(inputs)
});
export { dashboard_skillprofile_skip1 as "dashboard.skillProfile.skip" }