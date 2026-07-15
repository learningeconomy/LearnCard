/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Areyousuredelete3Inputs */

const en_boost_areyousuredelete3 = /** @type {(inputs: Boost_Areyousuredelete3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to delete this?`)
};

const es_boost_areyousuredelete3 = /** @type {(inputs: Boost_Areyousuredelete3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Seguro que quieres eliminar esto?`)
};

const fr_boost_areyousuredelete3 = /** @type {(inputs: Boost_Areyousuredelete3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir supprimer ceci ?`)
};

const ar_boost_areyousuredelete3 = /** @type {(inputs: Boost_Areyousuredelete3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to delete this?`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to delete this?" |
*
* @param {Boost_Areyousuredelete3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_areyousuredelete3 = /** @type {((inputs?: Boost_Areyousuredelete3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Areyousuredelete3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_areyousuredelete3(inputs)
	if (locale === "es") return es_boost_areyousuredelete3(inputs)
	if (locale === "fr") return fr_boost_areyousuredelete3(inputs)
	return ar_boost_areyousuredelete3(inputs)
});
export { boost_areyousuredelete3 as "boost.areYouSureDelete" }