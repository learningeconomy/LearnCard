/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Tools_Learnercontexttest_Label3Inputs */

const en_admintools_tools_learnercontexttest_label3 = /** @type {(inputs: Admintools_Tools_Learnercontexttest_Label3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Learner Context Test UX`)
};

const es_admintools_tools_learnercontexttest_label3 = /** @type {(inputs: Admintools_Tools_Learnercontexttest_Label3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`UX de prueba de contexto del estudiante`)
};

const fr_admintools_tools_learnercontexttest_label3 = /** @type {(inputs: Admintools_Tools_Learnercontexttest_Label3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`UX de test du contexte de l'apprenant`)
};

const ar_admintools_tools_learnercontexttest_label3 = /** @type {(inputs: Admintools_Tools_Learnercontexttest_Label3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`واجهة اختبار سياق المتعلّم`)
};

/**
* | output |
* | --- |
* | "Learner Context Test UX" |
*
* @param {Admintools_Tools_Learnercontexttest_Label3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_tools_learnercontexttest_label3 = /** @type {((inputs?: Admintools_Tools_Learnercontexttest_Label3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Tools_Learnercontexttest_Label3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_tools_learnercontexttest_label3(inputs)
	if (locale === "es") return es_admintools_tools_learnercontexttest_label3(inputs)
	if (locale === "fr") return fr_admintools_tools_learnercontexttest_label3(inputs)
	return ar_admintools_tools_learnercontexttest_label3(inputs)
});
export { admintools_tools_learnercontexttest_label3 as "adminTools.tools.learnerContextTest.label" }