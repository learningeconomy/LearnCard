/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Step_Searchinbox1Inputs */

const en_recovery_step_searchinbox1 = /** @type {(inputs: Recovery_Step_Searchinbox1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search your inbox for an email with the subject "Your LearnCard Recovery Key"`)
};

const es_recovery_step_searchinbox1 = /** @type {(inputs: Recovery_Step_Searchinbox1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Busca en tu bandeja de entrada un correo con el asunto "Tu Clave de Recuperación de LearnCard"`)
};

const fr_recovery_step_searchinbox1 = /** @type {(inputs: Recovery_Step_Searchinbox1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recherchez dans votre boîte de réception un e-mail avec l’objet "Votre clé de récupération LearnCard"`)
};

const ar_recovery_step_searchinbox1 = /** @type {(inputs: Recovery_Step_Searchinbox1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ابحث في بريدك الوارد عن بريد إلكتروني بعنوان "مفتاح استرداد LearnCard الخاص بك"`)
};

/**
* | output |
* | --- |
* | "Search your inbox for an email with the subject \"Your LearnCard Recovery Key\"" |
*
* @param {Recovery_Step_Searchinbox1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_step_searchinbox1 = /** @type {((inputs?: Recovery_Step_Searchinbox1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Step_Searchinbox1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_step_searchinbox1(inputs)
	if (locale === "es") return es_recovery_step_searchinbox1(inputs)
	if (locale === "fr") return fr_recovery_step_searchinbox1(inputs)
	return ar_recovery_step_searchinbox1(inputs)
});
export { recovery_step_searchinbox1 as "recovery.step.searchInbox" }