/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_GoalsInputs */

const en_pathways_goals = /** @type {(inputs: Pathways_GoalsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Goals`)
};

const es_pathways_goals = /** @type {(inputs: Pathways_GoalsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Objetivos`)
};

const de_pathways_goals = /** @type {(inputs: Pathways_GoalsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ziele`)
};

const ar_pathways_goals = /** @type {(inputs: Pathways_GoalsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الأهداف`)
};

const fr_pathways_goals = /** @type {(inputs: Pathways_GoalsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Objectifs`)
};

const ko_pathways_goals = /** @type {(inputs: Pathways_GoalsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`목표`)
};

/**
* | output |
* | --- |
* | "Goals" |
*
* @param {Pathways_GoalsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const pathways_goals = /** @type {((inputs?: Pathways_GoalsInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_GoalsInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_goals(inputs)
	if (locale === "es") return es_pathways_goals(inputs)
	if (locale === "de") return de_pathways_goals(inputs)
	if (locale === "ar") return ar_pathways_goals(inputs)
	if (locale === "fr") return fr_pathways_goals(inputs)
	return ko_pathways_goals(inputs)
});
export { pathways_goals as "pathways.goals" }