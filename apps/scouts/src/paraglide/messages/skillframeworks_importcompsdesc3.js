/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Importcompsdesc3Inputs */

const en_skillframeworks_importcompsdesc3 = /** @type {(inputs: Skillframeworks_Importcompsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Import competencies using our template or upload a JSON file.`)
};

const es_skillframeworks_importcompsdesc3 = /** @type {(inputs: Skillframeworks_Importcompsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importa competencias usando nuestra plantilla o sube un archivo JSON.`)
};

const fr_skillframeworks_importcompsdesc3 = /** @type {(inputs: Skillframeworks_Importcompsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importez des compétences à l'aide de notre modèle ou téléchargez un fichier JSON.`)
};

const ar_skillframeworks_importcompsdesc3 = /** @type {(inputs: Skillframeworks_Importcompsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Import competencies using our template or upload a JSON file.`)
};

/**
* | output |
* | --- |
* | "Import competencies using our template or upload a JSON file." |
*
* @param {Skillframeworks_Importcompsdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_importcompsdesc3 = /** @type {((inputs?: Skillframeworks_Importcompsdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Importcompsdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_importcompsdesc3(inputs)
	if (locale === "es") return es_skillframeworks_importcompsdesc3(inputs)
	if (locale === "fr") return fr_skillframeworks_importcompsdesc3(inputs)
	return ar_skillframeworks_importcompsdesc3(inputs)
});
export { skillframeworks_importcompsdesc3 as "skillFrameworks.importCompsDesc" }