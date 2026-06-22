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

const fr_issue_confirmunsuspend1 = /** @type {(inputs: Issue_Confirmunsuspend1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir réactiver ce titre ?`)
};

const ar_issue_confirmunsuspend1 = /** @type {(inputs: Issue_Confirmunsuspend1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد إعادة تفعيل هذه الشهادة؟`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to reactivate this credential?" |
*
* @param {Issue_Confirmunsuspend1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const issue_confirmunsuspend1 = /** @type {((inputs?: Issue_Confirmunsuspend1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_Confirmunsuspend1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_confirmunsuspend1(inputs)
	if (locale === "es") return es_issue_confirmunsuspend1(inputs)
	if (locale === "fr") return fr_issue_confirmunsuspend1(inputs)
	return ar_issue_confirmunsuspend1(inputs)
});
export { issue_confirmunsuspend1 as "issue.confirmUnsuspend" }