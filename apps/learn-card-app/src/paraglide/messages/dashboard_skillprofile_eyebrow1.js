/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Dashboard_Skillprofile_Eyebrow1Inputs */

const en_dashboard_skillprofile_eyebrow1 = /** @type {(inputs: Dashboard_Skillprofile_Eyebrow1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Make ${i?.brand} yours`)
};

const es_dashboard_skillprofile_eyebrow1 = /** @type {(inputs: Dashboard_Skillprofile_Eyebrow1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Haz ${i?.brand} tuyo`)
};

const fr_dashboard_skillprofile_eyebrow1 = /** @type {(inputs: Dashboard_Skillprofile_Eyebrow1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Faites de ${i?.brand} le vôtre`)
};

const ar_dashboard_skillprofile_eyebrow1 = /** @type {(inputs: Dashboard_Skillprofile_Eyebrow1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`اجعل ${i?.brand} خاصًا بك`)
};

/**
* | output |
* | --- |
* | "Make {brand} yours" |
*
* @param {Dashboard_Skillprofile_Eyebrow1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_skillprofile_eyebrow1 = /** @type {((inputs: Dashboard_Skillprofile_Eyebrow1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Skillprofile_Eyebrow1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_skillprofile_eyebrow1(inputs)
	if (locale === "es") return es_dashboard_skillprofile_eyebrow1(inputs)
	if (locale === "fr") return fr_dashboard_skillprofile_eyebrow1(inputs)
	return ar_dashboard_skillprofile_eyebrow1(inputs)
});
export { dashboard_skillprofile_eyebrow1 as "dashboard.skillProfile.eyebrow" }