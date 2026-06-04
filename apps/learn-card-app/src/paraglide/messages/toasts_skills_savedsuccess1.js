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

const de_toasts_skills_savedsuccess1 = /** @type {(inputs: Toasts_Skills_Savedsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fähigkeiten erfolgreich gespeichert!`)
};

const ar_toasts_skills_savedsuccess1 = /** @type {(inputs: Toasts_Skills_Savedsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم حفظ المهارات بنجاح!`)
};

const fr_toasts_skills_savedsuccess1 = /** @type {(inputs: Toasts_Skills_Savedsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétences enregistrées avec succès !`)
};

const ko_toasts_skills_savedsuccess1 = /** @type {(inputs: Toasts_Skills_Savedsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`기술이 성공적으로 저장되었습니다!`)
};

/**
* | output |
* | --- |
* | "Skills saved successfully!" |
*
* @param {Toasts_Skills_Savedsuccess1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_skills_savedsuccess1 = /** @type {((inputs?: Toasts_Skills_Savedsuccess1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Skills_Savedsuccess1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_skills_savedsuccess1(inputs)
	if (locale === "es") return es_toasts_skills_savedsuccess1(inputs)
	if (locale === "de") return de_toasts_skills_savedsuccess1(inputs)
	if (locale === "ar") return ar_toasts_skills_savedsuccess1(inputs)
	if (locale === "fr") return fr_toasts_skills_savedsuccess1(inputs)
	return ko_toasts_skills_savedsuccess1(inputs)
});
export { toasts_skills_savedsuccess1 as "toasts.skills.savedSuccess" }