/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Editdraft1Inputs */

const en_boost_editdraft1 = /** @type {(inputs: Boost_Editdraft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Draft`)
};

const es_boost_editdraft1 = /** @type {(inputs: Boost_Editdraft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar Borrador`)
};

const fr_boost_editdraft1 = /** @type {(inputs: Boost_Editdraft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier le brouillon`)
};

const ar_boost_editdraft1 = /** @type {(inputs: Boost_Editdraft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل المسودة`)
};

/**
* | output |
* | --- |
* | "Edit Draft" |
*
* @param {Boost_Editdraft1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_editdraft1 = /** @type {((inputs?: Boost_Editdraft1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Editdraft1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_editdraft1(inputs)
	if (locale === "es") return es_boost_editdraft1(inputs)
	if (locale === "fr") return fr_boost_editdraft1(inputs)
	return ar_boost_editdraft1(inputs)
});
export { boost_editdraft1 as "boost.editDraft" }