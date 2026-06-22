/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Menu_Personalizeaisessions2Inputs */

const en_profile_menu_personalizeaisessions2 = /** @type {(inputs: Profile_Menu_Personalizeaisessions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personalize AI Sessions`)
};

const es_profile_menu_personalizeaisessions2 = /** @type {(inputs: Profile_Menu_Personalizeaisessions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personalizar sesiones IA`)
};

const fr_profile_menu_personalizeaisessions2 = /** @type {(inputs: Profile_Menu_Personalizeaisessions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personnaliser les sessions IA`)
};

const ar_profile_menu_personalizeaisessions2 = /** @type {(inputs: Profile_Menu_Personalizeaisessions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تخصيص جلسات الذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "Personalize AI Sessions" |
*
* @param {Profile_Menu_Personalizeaisessions2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_menu_personalizeaisessions2 = /** @type {((inputs?: Profile_Menu_Personalizeaisessions2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Menu_Personalizeaisessions2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_menu_personalizeaisessions2(inputs)
	if (locale === "es") return es_profile_menu_personalizeaisessions2(inputs)
	if (locale === "fr") return fr_profile_menu_personalizeaisessions2(inputs)
	return ar_profile_menu_personalizeaisessions2(inputs)
});
export { profile_menu_personalizeaisessions2 as "profile.menu.personalizeAiSessions" }