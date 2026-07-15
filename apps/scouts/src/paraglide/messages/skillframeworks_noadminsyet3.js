/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Noadminsyet3Inputs */

const en_skillframeworks_noadminsyet3 = /** @type {(inputs: Skillframeworks_Noadminsyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No admins yet. Add one above.`)
};

const es_skillframeworks_noadminsyet3 = /** @type {(inputs: Skillframeworks_Noadminsyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay admins. Añade uno arriba.`)
};

const fr_skillframeworks_noadminsyet3 = /** @type {(inputs: Skillframeworks_Noadminsyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun administrateur pour l'instant. Ajoutez-en un ci-dessus.`)
};

const ar_skillframeworks_noadminsyet3 = /** @type {(inputs: Skillframeworks_Noadminsyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا يوجد مسؤولون بعد. أضف واحداً أعلاه.`)
};

/**
* | output |
* | --- |
* | "No admins yet. Add one above." |
*
* @param {Skillframeworks_Noadminsyet3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_noadminsyet3 = /** @type {((inputs?: Skillframeworks_Noadminsyet3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Noadminsyet3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_noadminsyet3(inputs)
	if (locale === "es") return es_skillframeworks_noadminsyet3(inputs)
	if (locale === "fr") return fr_skillframeworks_noadminsyet3(inputs)
	return ar_skillframeworks_noadminsyet3(inputs)
});
export { skillframeworks_noadminsyet3 as "skillFrameworks.noAdminsYet" }