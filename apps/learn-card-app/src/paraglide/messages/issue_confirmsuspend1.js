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

const fr_issue_confirmsuspend1 = /** @type {(inputs: Issue_Confirmsuspend1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir suspendre ce titre ?`)
};

const ar_issue_confirmsuspend1 = /** @type {(inputs: Issue_Confirmsuspend1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد تعليق هذه الشهادة؟`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to suspend this credential?" |
*
* @param {Issue_Confirmsuspend1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const issue_confirmsuspend1 = /** @type {((inputs?: Issue_Confirmsuspend1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_Confirmsuspend1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_confirmsuspend1(inputs)
	if (locale === "es") return es_issue_confirmsuspend1(inputs)
	if (locale === "fr") return fr_issue_confirmsuspend1(inputs)
	return ar_issue_confirmsuspend1(inputs)
});
export { issue_confirmsuspend1 as "issue.confirmSuspend" }