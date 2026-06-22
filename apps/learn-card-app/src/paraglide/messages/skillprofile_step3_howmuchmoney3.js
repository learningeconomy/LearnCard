/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step3_Howmuchmoney3Inputs */

const en_skillprofile_step3_howmuchmoney3 = /** @type {(inputs: Skillprofile_Step3_Howmuchmoney3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How much money do you make?`)
};

const es_skillprofile_step3_howmuchmoney3 = /** @type {(inputs: Skillprofile_Step3_Howmuchmoney3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Cuánto dinero ganas?`)
};

const fr_skillprofile_step3_howmuchmoney3 = /** @type {(inputs: Skillprofile_Step3_Howmuchmoney3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Combien gagnez-vous ?`)
};

const ar_skillprofile_step3_howmuchmoney3 = /** @type {(inputs: Skillprofile_Step3_Howmuchmoney3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كم تكسب؟`)
};

/**
* | output |
* | --- |
* | "How much money do you make?" |
*
* @param {Skillprofile_Step3_Howmuchmoney3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step3_howmuchmoney3 = /** @type {((inputs?: Skillprofile_Step3_Howmuchmoney3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step3_Howmuchmoney3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step3_howmuchmoney3(inputs)
	if (locale === "es") return es_skillprofile_step3_howmuchmoney3(inputs)
	if (locale === "fr") return fr_skillprofile_step3_howmuchmoney3(inputs)
	return ar_skillprofile_step3_howmuchmoney3(inputs)
});
export { skillprofile_step3_howmuchmoney3 as "skillProfile.step3.howMuchMoney" }