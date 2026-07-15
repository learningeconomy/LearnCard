/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Options_Leaveconfirm1Inputs */

const en_troops_options_leaveconfirm1 = /** @type {(inputs: Troops_Options_Leaveconfirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to leave {credential}?`)
};

const es_troops_options_leaveconfirm1 = /** @type {(inputs: Troops_Options_Leaveconfirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Seguro que quieres salir de {credential}?`)
};

const fr_troops_options_leaveconfirm1 = /** @type {(inputs: Troops_Options_Leaveconfirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir quitter {credential} ?`)
};

const ar_troops_options_leaveconfirm1 = /** @type {(inputs: Troops_Options_Leaveconfirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to leave {credential}?`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to leave {credential}?" |
*
* @param {Troops_Options_Leaveconfirm1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_options_leaveconfirm1 = /** @type {((inputs?: Troops_Options_Leaveconfirm1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Options_Leaveconfirm1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_options_leaveconfirm1(inputs)
	if (locale === "es") return es_troops_options_leaveconfirm1(inputs)
	if (locale === "fr") return fr_troops_options_leaveconfirm1(inputs)
	return ar_troops_options_leaveconfirm1(inputs)
});
export { troops_options_leaveconfirm1 as "troops.options.leaveConfirm" }