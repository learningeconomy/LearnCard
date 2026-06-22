/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step3_Annualsalary2Inputs */

const en_skillprofile_step3_annualsalary2 = /** @type {(inputs: Skillprofile_Step3_Annualsalary2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Annual Salary`)
};

const es_skillprofile_step3_annualsalary2 = /** @type {(inputs: Skillprofile_Step3_Annualsalary2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Salario anual`)
};

const fr_skillprofile_step3_annualsalary2 = /** @type {(inputs: Skillprofile_Step3_Annualsalary2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Salaire annuel`)
};

const ar_skillprofile_step3_annualsalary2 = /** @type {(inputs: Skillprofile_Step3_Annualsalary2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الراتب السنوي`)
};

/**
* | output |
* | --- |
* | "Annual Salary" |
*
* @param {Skillprofile_Step3_Annualsalary2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step3_annualsalary2 = /** @type {((inputs?: Skillprofile_Step3_Annualsalary2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step3_Annualsalary2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step3_annualsalary2(inputs)
	if (locale === "es") return es_skillprofile_step3_annualsalary2(inputs)
	if (locale === "fr") return fr_skillprofile_step3_annualsalary2(inputs)
	return ar_skillprofile_step3_annualsalary2(inputs)
});
export { skillprofile_step3_annualsalary2 as "skillProfile.step3.annualSalary" }