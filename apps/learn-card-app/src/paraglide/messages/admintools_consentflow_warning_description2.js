/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Consentflow_Warning_Description2Inputs */

const en_admintools_consentflow_warning_description2 = /** @type {(inputs: Admintools_Consentflow_Warning_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`To create a contract, you must be logged in as an Organization Profile. If you don't have one yet, please create an Organization Profile first.`)
};

const es_admintools_consentflow_warning_description2 = /** @type {(inputs: Admintools_Consentflow_Warning_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Para crear un contrato, debes haber iniciado sesión como perfil de Organización. Si aún no tienes uno, crea primero un perfil de Organización.`)
};

const fr_admintools_consentflow_warning_description2 = /** @type {(inputs: Admintools_Consentflow_Warning_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pour créer un contrat, vous devez être connecté avec un profil d'Organisation. Si vous n'en avez pas encore, veuillez d'abord créer un profil d'Organisation.`)
};

const ar_admintools_consentflow_warning_description2 = /** @type {(inputs: Admintools_Consentflow_Warning_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لإنشاء عقد، يجب أن تكون مسجّلاً الدخول بملف تعريف مؤسسة. إذا لم يكن لديك واحد بعد، فأنشئ ملف تعريف مؤسسة أولاً.`)
};

/**
* | output |
* | --- |
* | "To create a contract, you must be logged in as an Organization Profile. If you don't have one yet, please create an Organization Profile first." |
*
* @param {Admintools_Consentflow_Warning_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_consentflow_warning_description2 = /** @type {((inputs?: Admintools_Consentflow_Warning_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Consentflow_Warning_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_consentflow_warning_description2(inputs)
	if (locale === "es") return es_admintools_consentflow_warning_description2(inputs)
	if (locale === "fr") return fr_admintools_consentflow_warning_description2(inputs)
	return ar_admintools_consentflow_warning_description2(inputs)
});
export { admintools_consentflow_warning_description2 as "adminTools.consentFlow.warning.description" }