/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Worklife_Satisfied2Inputs */

const en_aipathways_worklife_satisfied2 = /** @type {(inputs: Aipathways_Worklife_Satisfied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Satisfied & Happy`)
};

const es_aipathways_worklife_satisfied2 = /** @type {(inputs: Aipathways_Worklife_Satisfied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Es Satisfactorio`)
};

const fr_aipathways_worklife_satisfied2 = /** @type {(inputs: Aipathways_Worklife_Satisfied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`C'est satisfaisant`)
};

const ar_aipathways_worklife_satisfied2 = /** @type {(inputs: Aipathways_Worklife_Satisfied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنه مرضٍ`)
};

/**
* | output |
* | --- |
* | "Satisfied & Happy" |
*
* @param {Aipathways_Worklife_Satisfied2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_worklife_satisfied2 = /** @type {((inputs?: Aipathways_Worklife_Satisfied2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Worklife_Satisfied2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_worklife_satisfied2(inputs)
	if (locale === "es") return es_aipathways_worklife_satisfied2(inputs)
	if (locale === "fr") return fr_aipathways_worklife_satisfied2(inputs)
	return ar_aipathways_worklife_satisfied2(inputs)
});
export { aipathways_worklife_satisfied2 as "aiPathways.workLife.satisfied" }