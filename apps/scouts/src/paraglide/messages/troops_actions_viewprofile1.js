/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Actions_Viewprofile1Inputs */

const en_troops_actions_viewprofile1 = /** @type {(inputs: Troops_Actions_Viewprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Profile`)
};

const es_troops_actions_viewprofile1 = /** @type {(inputs: Troops_Actions_Viewprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver Perfil`)
};

const fr_troops_actions_viewprofile1 = /** @type {(inputs: Troops_Actions_Viewprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir le profil`)
};

const ar_troops_actions_viewprofile1 = /** @type {(inputs: Troops_Actions_Viewprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض الملف الشخصي`)
};

/**
* | output |
* | --- |
* | "View Profile" |
*
* @param {Troops_Actions_Viewprofile1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_actions_viewprofile1 = /** @type {((inputs?: Troops_Actions_Viewprofile1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Actions_Viewprofile1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_actions_viewprofile1(inputs)
	if (locale === "es") return es_troops_actions_viewprofile1(inputs)
	if (locale === "fr") return fr_troops_actions_viewprofile1(inputs)
	return ar_troops_actions_viewprofile1(inputs)
});
export { troops_actions_viewprofile1 as "troops.actions.viewProfile" }