/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_Confirmrevoke1Inputs */

const en_issue_confirmrevoke1 = /** @type {(inputs: Issue_Confirmrevoke1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to revoke this credential? This action cannot be undone.`)
};

const es_issue_confirmrevoke1 = /** @type {(inputs: Issue_Confirmrevoke1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Estás seguro de que deseas revocar esta credencial? Esta acción no se puede deshacer.`)
};

const de_issue_confirmrevoke1 = /** @type {(inputs: Issue_Confirmrevoke1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bist du sicher, dass du diese Berechtigung widerrufen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.`)
};

const ar_issue_confirmrevoke1 = /** @type {(inputs: Issue_Confirmrevoke1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد إلغاء هذه الشهادة؟ لا يمكن التراجع عن هذا الإجراء.`)
};

const fr_issue_confirmrevoke1 = /** @type {(inputs: Issue_Confirmrevoke1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir révoquer ce titre ? Cette action est irréversible.`)
};

const ko_issue_confirmrevoke1 = /** @type {(inputs: Issue_Confirmrevoke1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 자격증명을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to revoke this credential? This action cannot be undone." |
*
* @param {Issue_Confirmrevoke1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const issue_confirmrevoke1 = /** @type {((inputs?: Issue_Confirmrevoke1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_Confirmrevoke1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_confirmrevoke1(inputs)
	if (locale === "es") return es_issue_confirmrevoke1(inputs)
	if (locale === "de") return de_issue_confirmrevoke1(inputs)
	if (locale === "ar") return ar_issue_confirmrevoke1(inputs)
	if (locale === "fr") return fr_issue_confirmrevoke1(inputs)
	return ko_issue_confirmrevoke1(inputs)
});
export { issue_confirmrevoke1 as "issue.confirmRevoke" }