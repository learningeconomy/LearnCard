/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Enddate2Inputs */

const en_skillprofile_step2_enddate2 = /** @type {(inputs: Skillprofile_Step2_Enddate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`End Date`)
};

const es_skillprofile_step2_enddate2 = /** @type {(inputs: Skillprofile_Step2_Enddate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fecha de fin`)
};

const fr_skillprofile_step2_enddate2 = /** @type {(inputs: Skillprofile_Step2_Enddate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date de fin`)
};

const ar_skillprofile_step2_enddate2 = /** @type {(inputs: Skillprofile_Step2_Enddate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ الانتهاء`)
};

/**
* | output |
* | --- |
* | "End Date" |
*
* @param {Skillprofile_Step2_Enddate2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_enddate2 = /** @type {((inputs?: Skillprofile_Step2_Enddate2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Enddate2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_enddate2(inputs)
	if (locale === "es") return es_skillprofile_step2_enddate2(inputs)
	if (locale === "fr") return fr_skillprofile_step2_enddate2(inputs)
	return ar_skillprofile_step2_enddate2(inputs)
});
export { skillprofile_step2_enddate2 as "skillProfile.step2.endDate" }