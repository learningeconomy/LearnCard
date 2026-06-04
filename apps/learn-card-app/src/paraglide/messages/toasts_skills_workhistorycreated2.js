/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Skills_Workhistorycreated2Inputs */

const en_toasts_skills_workhistorycreated2 = /** @type {(inputs: Toasts_Skills_Workhistorycreated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your work history credential has been created`)
};

const es_toasts_skills_workhistorycreated2 = /** @type {(inputs: Toasts_Skills_Workhistorycreated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se ha creado tu credencial de historial laboral`)
};

const de_toasts_skills_workhistorycreated2 = /** @type {(inputs: Toasts_Skills_Workhistorycreated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deine Berufslaufbahn-Berechtigung wurde erstellt`)
};

const ar_toasts_skills_workhistorycreated2 = /** @type {(inputs: Toasts_Skills_Workhistorycreated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إنشاء بيانات اعتماد سجل العمل الخاص بك`)
};

const fr_toasts_skills_workhistorycreated2 = /** @type {(inputs: Toasts_Skills_Workhistorycreated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre accréditation d'historique professionnel a été créée`)
};

const ko_toasts_skills_workhistorycreated2 = /** @type {(inputs: Toasts_Skills_Workhistorycreated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`직무 이력 자격 증명이 생성되었습니다`)
};

/**
* | output |
* | --- |
* | "Your work history credential has been created" |
*
* @param {Toasts_Skills_Workhistorycreated2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_skills_workhistorycreated2 = /** @type {((inputs?: Toasts_Skills_Workhistorycreated2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Skills_Workhistorycreated2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_skills_workhistorycreated2(inputs)
	if (locale === "es") return es_toasts_skills_workhistorycreated2(inputs)
	if (locale === "de") return de_toasts_skills_workhistorycreated2(inputs)
	if (locale === "ar") return ar_toasts_skills_workhistorycreated2(inputs)
	if (locale === "fr") return fr_toasts_skills_workhistorycreated2(inputs)
	return ko_toasts_skills_workhistorycreated2(inputs)
});
export { toasts_skills_workhistorycreated2 as "toasts.skills.workHistoryCreated" }