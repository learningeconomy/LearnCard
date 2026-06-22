/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Growskills_Edit1Inputs */

const en_growskills_edit1 = /** @type {(inputs: Growskills_Edit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit`)
};

const es_growskills_edit1 = /** @type {(inputs: Growskills_Edit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar`)
};

const fr_growskills_edit1 = /** @type {(inputs: Growskills_Edit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier`)
};

const ar_growskills_edit1 = /** @type {(inputs: Growskills_Edit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل`)
};

/**
* | output |
* | --- |
* | "Edit" |
*
* @param {Growskills_Edit1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const growskills_edit1 = /** @type {((inputs?: Growskills_Edit1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Growskills_Edit1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_growskills_edit1(inputs)
	if (locale === "es") return es_growskills_edit1(inputs)
	if (locale === "fr") return fr_growskills_edit1(inputs)
	return ar_growskills_edit1(inputs)
});
export { growskills_edit1 as "growSkills.edit" }