/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Createfwtitle3Inputs */

const en_skillframeworks_createfwtitle3 = /** @type {(inputs: Skillframeworks_Createfwtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Framework`)
};

const es_skillframeworks_createfwtitle3 = /** @type {(inputs: Skillframeworks_Createfwtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Marco`)
};

const fr_skillframeworks_createfwtitle3 = /** @type {(inputs: Skillframeworks_Createfwtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un cadre`)
};

const ar_skillframeworks_createfwtitle3 = /** @type {(inputs: Skillframeworks_Createfwtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Framework`)
};

/**
* | output |
* | --- |
* | "Create Framework" |
*
* @param {Skillframeworks_Createfwtitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_createfwtitle3 = /** @type {((inputs?: Skillframeworks_Createfwtitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Createfwtitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_createfwtitle3(inputs)
	if (locale === "es") return es_skillframeworks_createfwtitle3(inputs)
	if (locale === "fr") return fr_skillframeworks_createfwtitle3(inputs)
	return ar_skillframeworks_createfwtitle3(inputs)
});
export { skillframeworks_createfwtitle3 as "skillFrameworks.createFwTitle" }