/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_Confirmsuspend1Inputs */

const en_issue_confirmsuspend1 = /** @type {(inputs: Issue_Confirmsuspend1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to suspend this credential?`)
};

const es_issue_confirmsuspend1 = /** @type {(inputs: Issue_Confirmsuspend1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Estás seguro de que deseas suspender esta credencial?`)
};

const de_issue_confirmsuspend1 = /** @type {(inputs: Issue_Confirmsuspend1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bist du sicher, dass du diese Berechtigung sperren möchtest?`)
};

const ar_issue_confirmsuspend1 = /** @type {(inputs: Issue_Confirmsuspend1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد تعليق هذه الشهادة؟`)
};

const fr_issue_confirmsuspend1 = /** @type {(inputs: Issue_Confirmsuspend1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir suspendre ce titre ?`)
};

const ko_issue_confirmsuspend1 = /** @type {(inputs: Issue_Confirmsuspend1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 자격증명을 정지하시겠습니까?`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to suspend this credential?" |
*
* @param {Issue_Confirmsuspend1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const issue_confirmsuspend1 = /** @type {((inputs?: Issue_Confirmsuspend1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_Confirmsuspend1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_confirmsuspend1(inputs)
	if (locale === "es") return es_issue_confirmsuspend1(inputs)
	if (locale === "de") return de_issue_confirmsuspend1(inputs)
	if (locale === "ar") return ar_issue_confirmsuspend1(inputs)
	if (locale === "fr") return fr_issue_confirmsuspend1(inputs)
	return ko_issue_confirmsuspend1(inputs)
});
export { issue_confirmsuspend1 as "issue.confirmSuspend" }