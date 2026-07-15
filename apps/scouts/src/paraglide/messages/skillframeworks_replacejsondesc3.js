/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Replacejsondesc3Inputs */

const en_skillframeworks_replacejsondesc3 = /** @type {(inputs: Skillframeworks_Replacejsondesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Uploading a new file will replace your current file and discard your changes.`)
};

const es_skillframeworks_replacejsondesc3 = /** @type {(inputs: Skillframeworks_Replacejsondesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subir un nuevo archivo reemplazará tu archivo actual y descartará tus cambios.`)
};

const fr_skillframeworks_replacejsondesc3 = /** @type {(inputs: Skillframeworks_Replacejsondesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le téléchargement d'un nouveau fichier remplacera votre fichier actuel et annulera vos modifications.`)
};

const ar_skillframeworks_replacejsondesc3 = /** @type {(inputs: Skillframeworks_Replacejsondesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفع ملف جديد سيحل محل ملفك الحالي ويتجاهل تغييراتك.`)
};

/**
* | output |
* | --- |
* | "Uploading a new file will replace your current file and discard your changes." |
*
* @param {Skillframeworks_Replacejsondesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_replacejsondesc3 = /** @type {((inputs?: Skillframeworks_Replacejsondesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Replacejsondesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_replacejsondesc3(inputs)
	if (locale === "es") return es_skillframeworks_replacejsondesc3(inputs)
	if (locale === "fr") return fr_skillframeworks_replacejsondesc3(inputs)
	return ar_skillframeworks_replacejsondesc3(inputs)
});
export { skillframeworks_replacejsondesc3 as "skillFrameworks.replaceJsonDesc" }