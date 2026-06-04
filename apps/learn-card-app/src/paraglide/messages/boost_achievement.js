/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_AchievementInputs */

const en_boost_achievement = /** @type {(inputs: Boost_AchievementInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Achievement`)
};

const es_boost_achievement = /** @type {(inputs: Boost_AchievementInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logro`)
};

const de_boost_achievement = /** @type {(inputs: Boost_AchievementInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Errungenschaft`)
};

const ar_boost_achievement = /** @type {(inputs: Boost_AchievementInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنجاز`)
};

const fr_boost_achievement = /** @type {(inputs: Boost_AchievementInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réalisation`)
};

const ko_boost_achievement = /** @type {(inputs: Boost_AchievementInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`성과`)
};

/**
* | output |
* | --- |
* | "Achievement" |
*
* @param {Boost_AchievementInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_achievement = /** @type {((inputs?: Boost_AchievementInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_AchievementInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_achievement(inputs)
	if (locale === "es") return es_boost_achievement(inputs)
	if (locale === "de") return de_boost_achievement(inputs)
	if (locale === "ar") return ar_boost_achievement(inputs)
	if (locale === "fr") return fr_boost_achievement(inputs)
	return ko_boost_achievement(inputs)
});
export { boost_achievement as "boost.achievement" }