/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_Noskills1Inputs */

const en_pathways_noskills1 = /** @type {(inputs: Pathways_Noskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No skills added yet`)
};

const es_pathways_noskills1 = /** @type {(inputs: Pathways_Noskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay habilidades agregadas`)
};

const de_pathways_noskills1 = /** @type {(inputs: Pathways_Noskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Noch keine Fähigkeiten hinzugefügt`)
};

const ar_pathways_noskills1 = /** @type {(inputs: Pathways_Noskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم تتم إضافة مهارات بعد`)
};

const fr_pathways_noskills1 = /** @type {(inputs: Pathways_Noskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune compétence ajoutée pour le moment`)
};

const ko_pathways_noskills1 = /** @type {(inputs: Pathways_Noskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`아직 추가된 기술 없음`)
};

/**
* | output |
* | --- |
* | "No skills added yet" |
*
* @param {Pathways_Noskills1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const pathways_noskills1 = /** @type {((inputs?: Pathways_Noskills1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Noskills1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_noskills1(inputs)
	if (locale === "es") return es_pathways_noskills1(inputs)
	if (locale === "de") return de_pathways_noskills1(inputs)
	if (locale === "ar") return ar_pathways_noskills1(inputs)
	if (locale === "fr") return fr_pathways_noskills1(inputs)
	return ko_pathways_noskills1(inputs)
});
export { pathways_noskills1 as "pathways.noSkills" }