/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Skills_Savedsuccess1Inputs */

const en_toasts_skills_savedsuccess1 = /** @type {(inputs: Toasts_Skills_Savedsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skills saved successfully!`)
};

const es_toasts_skills_savedsuccess1 = /** @type {(inputs: Toasts_Skills_Savedsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Habilidades guardadas exitosamente!`)
};

const fr_toasts_skills_savedsuccess1 = /** @type {(inputs: Toasts_Skills_Savedsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétences enregistrées avec succès !`)
};

const ar_toasts_skills_savedsuccess1 = /** @type {(inputs: Toasts_Skills_Savedsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم حفظ المهارات بنجاح!`)
};

/**
* | output |
* | --- |
* | "Skills saved successfully!" |
*
* @param {Toasts_Skills_Savedsuccess1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_skills_savedsuccess1 = /** @type {((inputs?: Toasts_Skills_Savedsuccess1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Skills_Savedsuccess1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_skills_savedsuccess1(inputs)
	if (locale === "es") return es_toasts_skills_savedsuccess1(inputs)
	if (locale === "fr") return fr_toasts_skills_savedsuccess1(inputs)
	return ar_toasts_skills_savedsuccess1(inputs)
});
export { toasts_skills_savedsuccess1 as "toasts.skills.savedSuccess" }