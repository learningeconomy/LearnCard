/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Welcome_Pills_AchievementsInputs */

const en_login_welcome_pills_achievements = /** @type {(inputs: Login_Welcome_Pills_AchievementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Achievements`)
};

const es_login_welcome_pills_achievements = /** @type {(inputs: Login_Welcome_Pills_AchievementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logros`)
};

const fr_login_welcome_pills_achievements = /** @type {(inputs: Login_Welcome_Pills_AchievementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réalisations`)
};

const ar_login_welcome_pills_achievements = /** @type {(inputs: Login_Welcome_Pills_AchievementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإنجازات`)
};

/**
* | output |
* | --- |
* | "Achievements" |
*
* @param {Login_Welcome_Pills_AchievementsInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_welcome_pills_achievements = /** @type {((inputs?: Login_Welcome_Pills_AchievementsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Welcome_Pills_AchievementsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_welcome_pills_achievements(inputs)
	if (locale === "es") return es_login_welcome_pills_achievements(inputs)
	if (locale === "fr") return fr_login_welcome_pills_achievements(inputs)
	return ar_login_welcome_pills_achievements(inputs)
});
export { login_welcome_pills_achievements as "login.welcome.pills.achievements" }