/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Fulldescriptionplaceholder5Inputs */

const en_developerportal_components_appdetailsstep_fulldescriptionplaceholder5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Fulldescriptionplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Describe what your app does, its key features, and how it helps users...`)
};

const es_developerportal_components_appdetailsstep_fulldescriptionplaceholder5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Fulldescriptionplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Describe lo que hace tu aplicación, sus características clave y cómo ayuda a los usuarios...`)
};

const fr_developerportal_components_appdetailsstep_fulldescriptionplaceholder5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Fulldescriptionplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Décrivez ce que fait votre application, ses fonctionnalités clés et comment elle aide les utilisateurs...`)
};

const ar_developerportal_components_appdetailsstep_fulldescriptionplaceholder5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Fulldescriptionplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صف ما يفعله تطبيقك، وميزاته الرئيسية، وكيف يساعد المستخدمين...`)
};

/**
* | output |
* | --- |
* | "Describe what your app does, its key features, and how it helps users..." |
*
* @param {Developerportal_Components_Appdetailsstep_Fulldescriptionplaceholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_fulldescriptionplaceholder5 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Fulldescriptionplaceholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Fulldescriptionplaceholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_fulldescriptionplaceholder5(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_fulldescriptionplaceholder5(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_fulldescriptionplaceholder5(inputs)
	return ar_developerportal_components_appdetailsstep_fulldescriptionplaceholder5(inputs)
});
export { developerportal_components_appdetailsstep_fulldescriptionplaceholder5 as "developerPortal.components.appDetailsStep.fullDescriptionPlaceholder" }