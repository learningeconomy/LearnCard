/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Confirmdelete1Inputs */

const en_boost_confirmdelete1 = /** @type {(inputs: Boost_Confirmdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to delete this boost?`)
};

const es_boost_confirmdelete1 = /** @type {(inputs: Boost_Confirmdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Estás seguro de que deseas eliminar este boost?`)
};

const fr_boost_confirmdelete1 = /** @type {(inputs: Boost_Confirmdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir supprimer ce boost ?`)
};

const ar_boost_confirmdelete1 = /** @type {(inputs: Boost_Confirmdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد حذف هذه الترقية؟`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to delete this boost?" |
*
* @param {Boost_Confirmdelete1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_confirmdelete1 = /** @type {((inputs?: Boost_Confirmdelete1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Confirmdelete1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_confirmdelete1(inputs)
	if (locale === "es") return es_boost_confirmdelete1(inputs)
	if (locale === "fr") return fr_boost_confirmdelete1(inputs)
	return ar_boost_confirmdelete1(inputs)
});
export { boost_confirmdelete1 as "boost.confirmDelete" }