/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_History_TitleInputs */

const en_troops_history_title = /** @type {(inputs: Troops_History_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`History`)
};

const es_troops_history_title = /** @type {(inputs: Troops_History_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Historial`)
};

const fr_troops_history_title = /** @type {(inputs: Troops_History_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Historique`)
};

const ar_troops_history_title = /** @type {(inputs: Troops_History_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`السجل`)
};

/**
* | output |
* | --- |
* | "History" |
*
* @param {Troops_History_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_history_title = /** @type {((inputs?: Troops_History_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_History_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_history_title(inputs)
	if (locale === "es") return es_troops_history_title(inputs)
	if (locale === "fr") return fr_troops_history_title(inputs)
	return ar_troops_history_title(inputs)
});
export { troops_history_title as "troops.history.title" }