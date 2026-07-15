/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Achievements_Noboosts1Inputs */

const en_achievements_noboosts1 = /** @type {(inputs: Achievements_Noboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No boosts to manage yet`)
};

const es_achievements_noboosts1 = /** @type {(inputs: Achievements_Noboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay boosts que gestionar`)
};

const fr_achievements_noboosts1 = /** @type {(inputs: Achievements_Noboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun Boost à gérer pour l'instant`)
};

const ar_achievements_noboosts1 = /** @type {(inputs: Achievements_Noboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد تعزيزات لإدارتها بعد`)
};

/**
* | output |
* | --- |
* | "No boosts to manage yet" |
*
* @param {Achievements_Noboosts1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const achievements_noboosts1 = /** @type {((inputs?: Achievements_Noboosts1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Achievements_Noboosts1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_achievements_noboosts1(inputs)
	if (locale === "es") return es_achievements_noboosts1(inputs)
	if (locale === "fr") return fr_achievements_noboosts1(inputs)
	return ar_achievements_noboosts1(inputs)
});
export { achievements_noboosts1 as "achievements.noBoosts" }