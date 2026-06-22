/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Adding1Inputs */

const en_skillprofile_step2_adding1 = /** @type {(inputs: Skillprofile_Step2_Adding1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adding...`)
};

const es_skillprofile_step2_adding1 = /** @type {(inputs: Skillprofile_Step2_Adding1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadiendo...`)
};

const fr_skillprofile_step2_adding1 = /** @type {(inputs: Skillprofile_Step2_Adding1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajout...`)
};

const ar_skillprofile_step2_adding1 = /** @type {(inputs: Skillprofile_Step2_Adding1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ الإضافة...`)
};

/**
* | output |
* | --- |
* | "Adding..." |
*
* @param {Skillprofile_Step2_Adding1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_adding1 = /** @type {((inputs?: Skillprofile_Step2_Adding1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Adding1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_adding1(inputs)
	if (locale === "es") return es_skillprofile_step2_adding1(inputs)
	if (locale === "fr") return fr_skillprofile_step2_adding1(inputs)
	return ar_skillprofile_step2_adding1(inputs)
});
export { skillprofile_step2_adding1 as "skillProfile.step2.adding" }