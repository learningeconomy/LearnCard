/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_Confirmunsuspend1Inputs */

const en_issue_confirmunsuspend1 = /** @type {(inputs: Issue_Confirmunsuspend1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to reactivate this credential?`)
};

const es_issue_confirmunsuspend1 = /** @type {(inputs: Issue_Confirmunsuspend1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Estás seguro de que deseas reactivar esta credencial?`)
};

const de_issue_confirmunsuspend1 = /** @type {(inputs: Issue_Confirmunsuspend1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bist du sicher, dass du diese Berechtigung reaktivieren möchtest?`)
};

const ar_issue_confirmunsuspend1 = /** @type {(inputs: Issue_Confirmunsuspend1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد إعادة تفعيل هذه الشهادة؟`)
};

const fr_issue_confirmunsuspend1 = /** @type {(inputs: Issue_Confirmunsuspend1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir réactiver ce titre ?`)
};

const ko_issue_confirmunsuspend1 = /** @type {(inputs: Issue_Confirmunsuspend1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 자격증명을 재활성화하시겠습니까?`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to reactivate this credential?" |
*
* @param {Issue_Confirmunsuspend1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const issue_confirmunsuspend1 = /** @type {((inputs?: Issue_Confirmunsuspend1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_Confirmunsuspend1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_confirmunsuspend1(inputs)
	if (locale === "es") return es_issue_confirmunsuspend1(inputs)
	if (locale === "de") return de_issue_confirmunsuspend1(inputs)
	if (locale === "ar") return ar_issue_confirmunsuspend1(inputs)
	if (locale === "fr") return fr_issue_confirmunsuspend1(inputs)
	return ko_issue_confirmunsuspend1(inputs)
});
export { issue_confirmunsuspend1 as "issue.confirmUnsuspend" }