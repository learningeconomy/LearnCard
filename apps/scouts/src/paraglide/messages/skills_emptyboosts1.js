/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Emptyboosts1Inputs */

const en_skills_emptyboosts1 = /** @type {(inputs: Skills_Emptyboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You don't have any Boosts yet.`)
};

const es_skills_emptyboosts1 = /** @type {(inputs: Skills_Emptyboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no tienes Boosts.`)
};

const fr_skills_emptyboosts1 = /** @type {(inputs: Skills_Emptyboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous n'avez pas encore de Boosts.`)
};

const ar_skills_emptyboosts1 = /** @type {(inputs: Skills_Emptyboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ليس لديك أي تعزيزات بعد.`)
};

/**
* | output |
* | --- |
* | "You don't have any Boosts yet." |
*
* @param {Skills_Emptyboosts1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_emptyboosts1 = /** @type {((inputs?: Skills_Emptyboosts1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Emptyboosts1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_emptyboosts1(inputs)
	if (locale === "es") return es_skills_emptyboosts1(inputs)
	if (locale === "fr") return fr_skills_emptyboosts1(inputs)
	return ar_skills_emptyboosts1(inputs)
});
export { skills_emptyboosts1 as "skills.emptyBoosts" }