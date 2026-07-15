/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Achievements_NoneInputs */

const en_achievements_none = /** @type {(inputs: Achievements_NoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No achievements yet`)
};

const es_achievements_none = /** @type {(inputs: Achievements_NoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay logros`)
};

const fr_achievements_none = /** @type {(inputs: Achievements_NoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune réalisation pour l'instant`)
};

const ar_achievements_none = /** @type {(inputs: Achievements_NoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد إنجازات بعد`)
};

/**
* | output |
* | --- |
* | "No achievements yet" |
*
* @param {Achievements_NoneInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const achievements_none = /** @type {((inputs?: Achievements_NoneInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Achievements_NoneInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_achievements_none(inputs)
	if (locale === "es") return es_achievements_none(inputs)
	if (locale === "fr") return fr_achievements_none(inputs)
	return ar_achievements_none(inputs)
});
export { achievements_none as "achievements.none" }