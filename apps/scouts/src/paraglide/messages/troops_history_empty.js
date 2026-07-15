/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_History_EmptyInputs */

const en_troops_history_empty = /** @type {(inputs: Troops_History_EmptyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No history available`)
};

const es_troops_history_empty = /** @type {(inputs: Troops_History_EmptyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No hay historial disponible`)
};

const fr_troops_history_empty = /** @type {(inputs: Troops_History_EmptyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun historique disponible`)
};

const ar_troops_history_empty = /** @type {(inputs: Troops_History_EmptyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No history available`)
};

/**
* | output |
* | --- |
* | "No history available" |
*
* @param {Troops_History_EmptyInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_history_empty = /** @type {((inputs?: Troops_History_EmptyInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_History_EmptyInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_history_empty(inputs)
	if (locale === "es") return es_troops_history_empty(inputs)
	if (locale === "fr") return fr_troops_history_empty(inputs)
	return ar_troops_history_empty(inputs)
});
export { troops_history_empty as "troops.history.empty" }