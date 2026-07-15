/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Nofwyet3Inputs */

const en_skillframeworks_nofwyet3 = /** @type {(inputs: Skillframeworks_Nofwyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No frameworks yet. Create one to get started!`)
};

const es_skillframeworks_nofwyet3 = /** @type {(inputs: Skillframeworks_Nofwyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay marcos. ¡Crea uno para empezar!`)
};

const fr_skillframeworks_nofwyet3 = /** @type {(inputs: Skillframeworks_Nofwyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun cadre pour l'instant. Créez-en un pour commencer !`)
};

const ar_skillframeworks_nofwyet3 = /** @type {(inputs: Skillframeworks_Nofwyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No frameworks yet. Create one to get started!`)
};

/**
* | output |
* | --- |
* | "No frameworks yet. Create one to get started!" |
*
* @param {Skillframeworks_Nofwyet3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_nofwyet3 = /** @type {((inputs?: Skillframeworks_Nofwyet3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Nofwyet3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_nofwyet3(inputs)
	if (locale === "es") return es_skillframeworks_nofwyet3(inputs)
	if (locale === "fr") return fr_skillframeworks_nofwyet3(inputs)
	return ar_skillframeworks_nofwyet3(inputs)
});
export { skillframeworks_nofwyet3 as "skillFrameworks.noFwYet" }