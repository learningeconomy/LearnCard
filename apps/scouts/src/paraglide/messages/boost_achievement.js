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

const fr_boost_achievement = /** @type {(inputs: Boost_AchievementInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réalisation`)
};

const ar_boost_achievement = /** @type {(inputs: Boost_AchievementInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Achievement`)
};

/**
* | output |
* | --- |
* | "Achievement" |
*
* @param {Boost_AchievementInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_achievement = /** @type {((inputs?: Boost_AchievementInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_AchievementInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_achievement(inputs)
	if (locale === "es") return es_boost_achievement(inputs)
	if (locale === "fr") return fr_boost_achievement(inputs)
	return ar_boost_achievement(inputs)
});
export { boost_achievement as "boost.achievement" }