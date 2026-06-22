/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Startdate2Inputs */

const en_skillprofile_step2_startdate2 = /** @type {(inputs: Skillprofile_Step2_Startdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Start Date`)
};

const es_skillprofile_step2_startdate2 = /** @type {(inputs: Skillprofile_Step2_Startdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fecha de inicio`)
};

const fr_skillprofile_step2_startdate2 = /** @type {(inputs: Skillprofile_Step2_Startdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date de début`)
};

const ar_skillprofile_step2_startdate2 = /** @type {(inputs: Skillprofile_Step2_Startdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ البدء`)
};

/**
* | output |
* | --- |
* | "Start Date" |
*
* @param {Skillprofile_Step2_Startdate2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_startdate2 = /** @type {((inputs?: Skillprofile_Step2_Startdate2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Startdate2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_startdate2(inputs)
	if (locale === "es") return es_skillprofile_step2_startdate2(inputs)
	if (locale === "fr") return fr_skillprofile_step2_startdate2(inputs)
	return ar_skillprofile_step2_startdate2(inputs)
});
export { skillprofile_step2_startdate2 as "skillProfile.step2.startDate" }