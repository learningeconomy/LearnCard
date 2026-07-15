/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Removeadmintitle3Inputs */

const en_skillframeworks_removeadmintitle3 = /** @type {(inputs: Skillframeworks_Removeadmintitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remove admin`)
};

const es_skillframeworks_removeadmintitle3 = /** @type {(inputs: Skillframeworks_Removeadmintitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar admin`)
};

const fr_skillframeworks_removeadmintitle3 = /** @type {(inputs: Skillframeworks_Removeadmintitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer l'administrateur`)
};

const ar_skillframeworks_removeadmintitle3 = /** @type {(inputs: Skillframeworks_Removeadmintitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remove admin`)
};

/**
* | output |
* | --- |
* | "Remove admin" |
*
* @param {Skillframeworks_Removeadmintitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_removeadmintitle3 = /** @type {((inputs?: Skillframeworks_Removeadmintitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Removeadmintitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_removeadmintitle3(inputs)
	if (locale === "es") return es_skillframeworks_removeadmintitle3(inputs)
	if (locale === "fr") return fr_skillframeworks_removeadmintitle3(inputs)
	return ar_skillframeworks_removeadmintitle3(inputs)
});
export { skillframeworks_removeadmintitle3 as "skillFrameworks.removeAdminTitle" }