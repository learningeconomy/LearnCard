/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Actions_Removefrom1Inputs */

const en_troops_actions_removefrom1 = /** @type {(inputs: Troops_Actions_Removefrom1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remove from {name}`)
};

const es_troops_actions_removefrom1 = /** @type {(inputs: Troops_Actions_Removefrom1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar de {name}`)
};

const fr_troops_actions_removefrom1 = /** @type {(inputs: Troops_Actions_Removefrom1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retirer de {name}`)
};

const ar_troops_actions_removefrom1 = /** @type {(inputs: Troops_Actions_Removefrom1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إزالة من {name}`)
};

/**
* | output |
* | --- |
* | "Remove from {name}" |
*
* @param {Troops_Actions_Removefrom1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_actions_removefrom1 = /** @type {((inputs?: Troops_Actions_Removefrom1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Actions_Removefrom1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_actions_removefrom1(inputs)
	if (locale === "es") return es_troops_actions_removefrom1(inputs)
	if (locale === "fr") return fr_troops_actions_removefrom1(inputs)
	return ar_troops_actions_removefrom1(inputs)
});
export { troops_actions_removefrom1 as "troops.actions.removeFrom" }