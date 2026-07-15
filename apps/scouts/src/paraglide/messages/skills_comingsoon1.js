/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Comingsoon1Inputs */

const en_skills_comingsoon1 = /** @type {(inputs: Skills_Comingsoon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Coming Soon...`)
};

const es_skills_comingsoon1 = /** @type {(inputs: Skills_Comingsoon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Próximamente...`)
};

const fr_skills_comingsoon1 = /** @type {(inputs: Skills_Comingsoon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bientôt disponible...`)
};

const ar_skills_comingsoon1 = /** @type {(inputs: Skills_Comingsoon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قريباً...`)
};

/**
* | output |
* | --- |
* | "Coming Soon..." |
*
* @param {Skills_Comingsoon1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_comingsoon1 = /** @type {((inputs?: Skills_Comingsoon1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Comingsoon1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_comingsoon1(inputs)
	if (locale === "es") return es_skills_comingsoon1(inputs)
	if (locale === "fr") return fr_skills_comingsoon1(inputs)
	return ar_skills_comingsoon1(inputs)
});
export { skills_comingsoon1 as "skills.comingSoon" }