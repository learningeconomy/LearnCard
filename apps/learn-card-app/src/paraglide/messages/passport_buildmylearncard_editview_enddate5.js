/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Editview_Enddate5Inputs */

const en_passport_buildmylearncard_editview_enddate5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Enddate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`End Date`)
};

const es_passport_buildmylearncard_editview_enddate5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Enddate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fecha de fin`)
};

const fr_passport_buildmylearncard_editview_enddate5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Enddate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date de fin`)
};

const ar_passport_buildmylearncard_editview_enddate5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Enddate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ الانتهاء`)
};

/**
* | output |
* | --- |
* | "End Date" |
*
* @param {Passport_Buildmylearncard_Editview_Enddate5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_editview_enddate5 = /** @type {((inputs?: Passport_Buildmylearncard_Editview_Enddate5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Editview_Enddate5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_editview_enddate5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_editview_enddate5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_editview_enddate5(inputs)
	return ar_passport_buildmylearncard_editview_enddate5(inputs)
});
export { passport_buildmylearncard_editview_enddate5 as "passport.buildMyLearnCard.editView.endDate" }