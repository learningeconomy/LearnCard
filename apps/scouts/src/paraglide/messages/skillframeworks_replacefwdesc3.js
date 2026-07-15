/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Replacefwdesc3Inputs */

const en_skillframeworks_replacefwdesc3 = /** @type {(inputs: Skillframeworks_Replacefwdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`To replace your current framework, you can upload a new JSON file.`)
};

const es_skillframeworks_replacefwdesc3 = /** @type {(inputs: Skillframeworks_Replacefwdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Para reemplazar tu marco actual, puedes subir un nuevo archivo JSON.`)
};

const fr_skillframeworks_replacefwdesc3 = /** @type {(inputs: Skillframeworks_Replacefwdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pour remplacer votre cadre actuel, vous pouvez télécharger un nouveau fichier JSON.`)
};

const ar_skillframeworks_replacefwdesc3 = /** @type {(inputs: Skillframeworks_Replacefwdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`To replace your current framework, you can upload a new JSON file.`)
};

/**
* | output |
* | --- |
* | "To replace your current framework, you can upload a new JSON file." |
*
* @param {Skillframeworks_Replacefwdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_replacefwdesc3 = /** @type {((inputs?: Skillframeworks_Replacefwdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Replacefwdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_replacefwdesc3(inputs)
	if (locale === "es") return es_skillframeworks_replacefwdesc3(inputs)
	if (locale === "fr") return fr_skillframeworks_replacefwdesc3(inputs)
	return ar_skillframeworks_replacefwdesc3(inputs)
});
export { skillframeworks_replacefwdesc3 as "skillFrameworks.replaceFwDesc" }