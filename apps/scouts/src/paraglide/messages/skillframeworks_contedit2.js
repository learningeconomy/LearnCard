/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Contedit2Inputs */

const en_skillframeworks_contedit2 = /** @type {(inputs: Skillframeworks_Contedit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue Editing`)
};

const es_skillframeworks_contedit2 = /** @type {(inputs: Skillframeworks_Contedit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seguir Editando`)
};

const fr_skillframeworks_contedit2 = /** @type {(inputs: Skillframeworks_Contedit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer la modification`)
};

const ar_skillframeworks_contedit2 = /** @type {(inputs: Skillframeworks_Contedit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متابعة التعديل`)
};

/**
* | output |
* | --- |
* | "Continue Editing" |
*
* @param {Skillframeworks_Contedit2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_contedit2 = /** @type {((inputs?: Skillframeworks_Contedit2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Contedit2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_contedit2(inputs)
	if (locale === "es") return es_skillframeworks_contedit2(inputs)
	if (locale === "fr") return fr_skillframeworks_contedit2(inputs)
	return ar_skillframeworks_contedit2(inputs)
});
export { skillframeworks_contedit2 as "skillFrameworks.contEdit" }