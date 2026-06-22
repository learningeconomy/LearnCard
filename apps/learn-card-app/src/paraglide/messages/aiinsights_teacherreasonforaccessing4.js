/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Teacherreasonforaccessing4Inputs */

const en_aiinsights_teacherreasonforaccessing4 = /** @type {(inputs: Aiinsights_Teacherreasonforaccessing4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your teacher needs this data to view your progress and provide feedback.`)
};

const es_aiinsights_teacherreasonforaccessing4 = /** @type {(inputs: Aiinsights_Teacherreasonforaccessing4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu profesor necesita estos datos para ver tu progreso y brindarte retroalimentación.`)
};

const fr_aiinsights_teacherreasonforaccessing4 = /** @type {(inputs: Aiinsights_Teacherreasonforaccessing4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre enseignant a besoin de ces données pour voir votre progression et vous donner un retour.`)
};

const ar_aiinsights_teacherreasonforaccessing4 = /** @type {(inputs: Aiinsights_Teacherreasonforaccessing4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يحتاج معلمك إلى هذه البيانات لعرض تقدمك وتقديم الملاحظات.`)
};

/**
* | output |
* | --- |
* | "Your teacher needs this data to view your progress and provide feedback." |
*
* @param {Aiinsights_Teacherreasonforaccessing4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_teacherreasonforaccessing4 = /** @type {((inputs?: Aiinsights_Teacherreasonforaccessing4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Teacherreasonforaccessing4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_teacherreasonforaccessing4(inputs)
	if (locale === "es") return es_aiinsights_teacherreasonforaccessing4(inputs)
	if (locale === "fr") return fr_aiinsights_teacherreasonforaccessing4(inputs)
	return ar_aiinsights_teacherreasonforaccessing4(inputs)
});
export { aiinsights_teacherreasonforaccessing4 as "aiInsights.teacherReasonForAccessing" }