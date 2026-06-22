/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Editview_Criteriaplaceholder5Inputs */

const en_passport_buildmylearncard_editview_criteriaplaceholder5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Criteriaplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Criteria for earning this credential...`)
};

const es_passport_buildmylearncard_editview_criteriaplaceholder5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Criteriaplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Criterios para obtener esta credencial...`)
};

const fr_passport_buildmylearncard_editview_criteriaplaceholder5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Criteriaplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Critères d'obtention de ce justificatif...`)
};

const ar_passport_buildmylearncard_editview_criteriaplaceholder5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Criteriaplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معايير الحصول على بيان الاعتماد هذا...`)
};

/**
* | output |
* | --- |
* | "Criteria for earning this credential..." |
*
* @param {Passport_Buildmylearncard_Editview_Criteriaplaceholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_editview_criteriaplaceholder5 = /** @type {((inputs?: Passport_Buildmylearncard_Editview_Criteriaplaceholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Editview_Criteriaplaceholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_editview_criteriaplaceholder5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_editview_criteriaplaceholder5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_editview_criteriaplaceholder5(inputs)
	return ar_passport_buildmylearncard_editview_criteriaplaceholder5(inputs)
});
export { passport_buildmylearncard_editview_criteriaplaceholder5 as "passport.buildMyLearnCard.editView.criteriaPlaceholder" }