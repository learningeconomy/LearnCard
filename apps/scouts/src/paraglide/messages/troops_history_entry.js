/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_History_EntryInputs */

const en_troops_history_entry = /** @type {(inputs: Troops_History_EntryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{type} on {date}`)
};

const es_troops_history_entry = /** @type {(inputs: Troops_History_EntryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{type} el {date}`)
};

const fr_troops_history_entry = /** @type {(inputs: Troops_History_EntryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{type} le {date}`)
};

const ar_troops_history_entry = /** @type {(inputs: Troops_History_EntryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{type} on {date}`)
};

/**
* | output |
* | --- |
* | "{type} on {date}" |
*
* @param {Troops_History_EntryInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_history_entry = /** @type {((inputs?: Troops_History_EntryInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_History_EntryInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_history_entry(inputs)
	if (locale === "es") return es_troops_history_entry(inputs)
	if (locale === "fr") return fr_troops_history_entry(inputs)
	return ar_troops_history_entry(inputs)
});
export { troops_history_entry as "troops.history.entry" }