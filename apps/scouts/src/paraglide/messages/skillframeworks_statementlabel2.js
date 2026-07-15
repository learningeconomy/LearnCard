/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Statementlabel2Inputs */

const en_skillframeworks_statementlabel2 = /** @type {(inputs: Skillframeworks_Statementlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Statement`)
};

const es_skillframeworks_statementlabel2 = /** @type {(inputs: Skillframeworks_Statementlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Declaración`)
};

const fr_skillframeworks_statementlabel2 = /** @type {(inputs: Skillframeworks_Statementlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Énoncé`)
};

const ar_skillframeworks_statementlabel2 = /** @type {(inputs: Skillframeworks_Statementlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Statement`)
};

/**
* | output |
* | --- |
* | "Statement" |
*
* @param {Skillframeworks_Statementlabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_statementlabel2 = /** @type {((inputs?: Skillframeworks_Statementlabel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Statementlabel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_statementlabel2(inputs)
	if (locale === "es") return es_skillframeworks_statementlabel2(inputs)
	if (locale === "fr") return fr_skillframeworks_statementlabel2(inputs)
	return ar_skillframeworks_statementlabel2(inputs)
});
export { skillframeworks_statementlabel2 as "skillFrameworks.statementLabel" }