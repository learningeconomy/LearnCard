/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Boostsbyskill_Noboosts3Inputs */

const en_skills_boostsbyskill_noboosts3 = /** @type {(inputs: Skills_Boostsbyskill_Noboosts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No Boosts yet!`)
};

const es_skills_boostsbyskill_noboosts3 = /** @type {(inputs: Skills_Boostsbyskill_Noboosts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Aún no hay Boosts!`)
};

const fr_skills_boostsbyskill_noboosts3 = /** @type {(inputs: Skills_Boostsbyskill_Noboosts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pas encore de Boosts !`)
};

const ar_skills_boostsbyskill_noboosts3 = /** @type {(inputs: Skills_Boostsbyskill_Noboosts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد Boosts بعد!`)
};

/**
* | output |
* | --- |
* | "No Boosts yet!" |
*
* @param {Skills_Boostsbyskill_Noboosts3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_boostsbyskill_noboosts3 = /** @type {((inputs?: Skills_Boostsbyskill_Noboosts3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Boostsbyskill_Noboosts3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_boostsbyskill_noboosts3(inputs)
	if (locale === "es") return es_skills_boostsbyskill_noboosts3(inputs)
	if (locale === "fr") return fr_skills_boostsbyskill_noboosts3(inputs)
	return ar_skills_boostsbyskill_noboosts3(inputs)
});
export { skills_boostsbyskill_noboosts3 as "skills.boostsBySkill.noBoosts" }