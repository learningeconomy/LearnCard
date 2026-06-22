/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Editview_Nameplaceholder5Inputs */

const en_passport_buildmylearncard_editview_nameplaceholder5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Nameplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g. Software Engineer at Acme Corp`)
};

const es_passport_buildmylearncard_editview_nameplaceholder5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Nameplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`p. ej., Ingeniero de software en Acme Corp`)
};

const fr_passport_buildmylearncard_editview_nameplaceholder5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Nameplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`p. ex. Ingénieur logiciel chez Acme Corp`)
};

const ar_passport_buildmylearncard_editview_nameplaceholder5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Nameplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: مهندس برمجيات في Acme Corp`)
};

/**
* | output |
* | --- |
* | "e.g. Software Engineer at Acme Corp" |
*
* @param {Passport_Buildmylearncard_Editview_Nameplaceholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_editview_nameplaceholder5 = /** @type {((inputs?: Passport_Buildmylearncard_Editview_Nameplaceholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Editview_Nameplaceholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_editview_nameplaceholder5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_editview_nameplaceholder5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_editview_nameplaceholder5(inputs)
	return ar_passport_buildmylearncard_editview_nameplaceholder5(inputs)
});
export { passport_buildmylearncard_editview_nameplaceholder5 as "passport.buildMyLearnCard.editView.namePlaceholder" }