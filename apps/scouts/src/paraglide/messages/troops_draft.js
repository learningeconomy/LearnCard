/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_DraftInputs */

const en_troops_draft = /** @type {(inputs: Troops_DraftInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Draft`)
};

const es_troops_draft = /** @type {(inputs: Troops_DraftInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Borrador`)
};

const fr_troops_draft = /** @type {(inputs: Troops_DraftInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Brouillon`)
};

const ar_troops_draft = /** @type {(inputs: Troops_DraftInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسودة`)
};

/**
* | output |
* | --- |
* | "Draft" |
*
* @param {Troops_DraftInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_draft = /** @type {((inputs?: Troops_DraftInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_DraftInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_draft(inputs)
	if (locale === "es") return es_troops_draft(inputs)
	if (locale === "fr") return fr_troops_draft(inputs)
	return ar_troops_draft(inputs)
});
export { troops_draft as "troops.draft" }