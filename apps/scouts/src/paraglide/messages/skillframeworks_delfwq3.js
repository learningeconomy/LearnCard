/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Delfwq3Inputs */

const en_skillframeworks_delfwq3 = /** @type {(inputs: Skillframeworks_Delfwq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete Framework?`)
};

const es_skillframeworks_delfwq3 = /** @type {(inputs: Skillframeworks_Delfwq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Eliminar Marco?`)
};

const fr_skillframeworks_delfwq3 = /** @type {(inputs: Skillframeworks_Delfwq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer le cadre ?`)
};

const ar_skillframeworks_delfwq3 = /** @type {(inputs: Skillframeworks_Delfwq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حذف الإطار؟`)
};

/**
* | output |
* | --- |
* | "Delete Framework?" |
*
* @param {Skillframeworks_Delfwq3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_delfwq3 = /** @type {((inputs?: Skillframeworks_Delfwq3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Delfwq3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_delfwq3(inputs)
	if (locale === "es") return es_skillframeworks_delfwq3(inputs)
	if (locale === "fr") return fr_skillframeworks_delfwq3(inputs)
	return ar_skillframeworks_delfwq3(inputs)
});
export { skillframeworks_delfwq3 as "skillFrameworks.delFwQ" }