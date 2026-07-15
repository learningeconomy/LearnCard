/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Delfwopt3Inputs */

const en_skillframeworks_delfwopt3 = /** @type {(inputs: Skillframeworks_Delfwopt3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete Framework`)
};

const es_skillframeworks_delfwopt3 = /** @type {(inputs: Skillframeworks_Delfwopt3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar Marco`)
};

const fr_skillframeworks_delfwopt3 = /** @type {(inputs: Skillframeworks_Delfwopt3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer le cadre`)
};

const ar_skillframeworks_delfwopt3 = /** @type {(inputs: Skillframeworks_Delfwopt3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حذف الإطار`)
};

/**
* | output |
* | --- |
* | "Delete Framework" |
*
* @param {Skillframeworks_Delfwopt3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_delfwopt3 = /** @type {((inputs?: Skillframeworks_Delfwopt3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Delfwopt3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_delfwopt3(inputs)
	if (locale === "es") return es_skillframeworks_delfwopt3(inputs)
	if (locale === "fr") return fr_skillframeworks_delfwopt3(inputs)
	return ar_skillframeworks_delfwopt3(inputs)
});
export { skillframeworks_delfwopt3 as "skillFrameworks.delFwOpt" }