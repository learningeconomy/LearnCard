/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Editview_Startdate5Inputs */

const en_passport_buildmylearncard_editview_startdate5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Startdate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Start Date`)
};

const es_passport_buildmylearncard_editview_startdate5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Startdate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fecha de inicio`)
};

const fr_passport_buildmylearncard_editview_startdate5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Startdate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date de début`)
};

const ar_passport_buildmylearncard_editview_startdate5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Startdate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ البدء`)
};

/**
* | output |
* | --- |
* | "Start Date" |
*
* @param {Passport_Buildmylearncard_Editview_Startdate5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_editview_startdate5 = /** @type {((inputs?: Passport_Buildmylearncard_Editview_Startdate5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Editview_Startdate5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_editview_startdate5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_editview_startdate5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_editview_startdate5(inputs)
	return ar_passport_buildmylearncard_editview_startdate5(inputs)
});
export { passport_buildmylearncard_editview_startdate5 as "passport.buildMyLearnCard.editView.startDate" }