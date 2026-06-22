/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Shortboost_Editdraft2Inputs */

const en_boost_shortboost_editdraft2 = /** @type {(inputs: Boost_Shortboost_Editdraft2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Draft`)
};

const es_boost_shortboost_editdraft2 = /** @type {(inputs: Boost_Shortboost_Editdraft2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar borrador`)
};

const fr_boost_shortboost_editdraft2 = /** @type {(inputs: Boost_Shortboost_Editdraft2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier le brouillon`)
};

const ar_boost_shortboost_editdraft2 = /** @type {(inputs: Boost_Shortboost_Editdraft2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل المسودة`)
};

/**
* | output |
* | --- |
* | "Edit Draft" |
*
* @param {Boost_Shortboost_Editdraft2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_shortboost_editdraft2 = /** @type {((inputs?: Boost_Shortboost_Editdraft2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Shortboost_Editdraft2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_shortboost_editdraft2(inputs)
	if (locale === "es") return es_boost_shortboost_editdraft2(inputs)
	if (locale === "fr") return fr_boost_shortboost_editdraft2(inputs)
	return ar_boost_shortboost_editdraft2(inputs)
});
export { boost_shortboost_editdraft2 as "boost.shortBoost.editDraft" }