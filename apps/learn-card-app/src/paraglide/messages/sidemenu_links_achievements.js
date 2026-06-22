/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Links_AchievementsInputs */

const en_sidemenu_links_achievements = /** @type {(inputs: Sidemenu_Links_AchievementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Achievements`)
};

const es_sidemenu_links_achievements = /** @type {(inputs: Sidemenu_Links_AchievementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logros`)
};

const fr_sidemenu_links_achievements = /** @type {(inputs: Sidemenu_Links_AchievementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réalisations`)
};

const ar_sidemenu_links_achievements = /** @type {(inputs: Sidemenu_Links_AchievementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإنجازات`)
};

/**
* | output |
* | --- |
* | "Achievements" |
*
* @param {Sidemenu_Links_AchievementsInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_achievements = /** @type {((inputs?: Sidemenu_Links_AchievementsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_AchievementsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_achievements(inputs)
	if (locale === "es") return es_sidemenu_links_achievements(inputs)
	if (locale === "fr") return fr_sidemenu_links_achievements(inputs)
	return ar_sidemenu_links_achievements(inputs)
});
export { sidemenu_links_achievements as "sidemenu.links.achievements" }