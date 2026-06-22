/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step3_Description1Inputs */

const en_skillprofile_step3_description1 = /** @type {(inputs: Skillprofile_Step3_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This helps us to show you where you stand compared to other people with the same role and experience.`)
};

const es_skillprofile_step3_description1 = /** @type {(inputs: Skillprofile_Step3_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esto nos ayuda a mostrarte tu posición en comparación con otras personas con el mismo puesto y experiencia.`)
};

const fr_skillprofile_step3_description1 = /** @type {(inputs: Skillprofile_Step3_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cela nous aide à vous situer par rapport à d'autres personnes ayant le même poste et la même expérience.`)
};

const ar_skillprofile_step3_description1 = /** @type {(inputs: Skillprofile_Step3_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يساعدنا هذا على إظهار موقعك مقارنةً بأشخاص آخرين لهم نفس الدور والخبرة.`)
};

/**
* | output |
* | --- |
* | "This helps us to show you where you stand compared to other people with the same role and experience." |
*
* @param {Skillprofile_Step3_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step3_description1 = /** @type {((inputs?: Skillprofile_Step3_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step3_Description1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step3_description1(inputs)
	if (locale === "es") return es_skillprofile_step3_description1(inputs)
	if (locale === "fr") return fr_skillprofile_step3_description1(inputs)
	return ar_skillprofile_step3_description1(inputs)
});
export { skillprofile_step3_description1 as "skillProfile.step3.description" }