/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Actions_LeaveInputs */

const en_troops_actions_leave = /** @type {(inputs: Troops_Actions_LeaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Leave {name}`)
};

const es_troops_actions_leave = /** @type {(inputs: Troops_Actions_LeaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Salir de {name}`)
};

const fr_troops_actions_leave = /** @type {(inputs: Troops_Actions_LeaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quitter {name}`)
};

const ar_troops_actions_leave = /** @type {(inputs: Troops_Actions_LeaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مغادرة {name}`)
};

/**
* | output |
* | --- |
* | "Leave {name}" |
*
* @param {Troops_Actions_LeaveInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_actions_leave = /** @type {((inputs?: Troops_Actions_LeaveInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Actions_LeaveInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_actions_leave(inputs)
	if (locale === "es") return es_troops_actions_leave(inputs)
	if (locale === "fr") return fr_troops_actions_leave(inputs)
	return ar_troops_actions_leave(inputs)
});
export { troops_actions_leave as "troops.actions.leave" }