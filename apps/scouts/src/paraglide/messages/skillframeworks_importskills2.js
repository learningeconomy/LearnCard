/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Importskills2Inputs */

const en_skillframeworks_importskills2 = /** @type {(inputs: Skillframeworks_Importskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Import Skills`)
};

const es_skillframeworks_importskills2 = /** @type {(inputs: Skillframeworks_Importskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importar Habilidades`)
};

const fr_skillframeworks_importskills2 = /** @type {(inputs: Skillframeworks_Importskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importer des compétences`)
};

const ar_skillframeworks_importskills2 = /** @type {(inputs: Skillframeworks_Importskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استيراد المهارات`)
};

/**
* | output |
* | --- |
* | "Import Skills" |
*
* @param {Skillframeworks_Importskills2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_importskills2 = /** @type {((inputs?: Skillframeworks_Importskills2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Importskills2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_importskills2(inputs)
	if (locale === "es") return es_skillframeworks_importskills2(inputs)
	if (locale === "fr") return fr_skillframeworks_importskills2(inputs)
	return ar_skillframeworks_importskills2(inputs)
});
export { skillframeworks_importskills2 as "skillFrameworks.importSkills" }