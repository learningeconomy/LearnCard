/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Createnewfw3Inputs */

const en_skillframeworks_createnewfw3 = /** @type {(inputs: Skillframeworks_Createnewfw3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create New Framework`)
};

const es_skillframeworks_createnewfw3 = /** @type {(inputs: Skillframeworks_Createnewfw3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Nuevo Marco`)
};

const fr_skillframeworks_createnewfw3 = /** @type {(inputs: Skillframeworks_Createnewfw3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un nouveau cadre`)
};

const ar_skillframeworks_createnewfw3 = /** @type {(inputs: Skillframeworks_Createnewfw3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create New Framework`)
};

/**
* | output |
* | --- |
* | "Create New Framework" |
*
* @param {Skillframeworks_Createnewfw3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_createnewfw3 = /** @type {((inputs?: Skillframeworks_Createnewfw3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Createnewfw3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_createnewfw3(inputs)
	if (locale === "es") return es_skillframeworks_createnewfw3(inputs)
	if (locale === "fr") return fr_skillframeworks_createnewfw3(inputs)
	return ar_skillframeworks_createnewfw3(inputs)
});
export { skillframeworks_createnewfw3 as "skillFrameworks.createNewFw" }