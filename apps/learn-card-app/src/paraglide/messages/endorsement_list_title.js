/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_List_TitleInputs */

const en_endorsement_list_title = /** @type {(inputs: Endorsement_List_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Endorsements`)
};

const es_endorsement_list_title = /** @type {(inputs: Endorsement_List_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Avales`)
};

const fr_endorsement_list_title = /** @type {(inputs: Endorsement_List_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recommandations`)
};

const ar_endorsement_list_title = /** @type {(inputs: Endorsement_List_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التوصيات`)
};

/**
* | output |
* | --- |
* | "Endorsements" |
*
* @param {Endorsement_List_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_list_title = /** @type {((inputs?: Endorsement_List_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_List_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_list_title(inputs)
	if (locale === "es") return es_endorsement_list_title(inputs)
	if (locale === "fr") return fr_endorsement_list_title(inputs)
	return ar_endorsement_list_title(inputs)
});
export { endorsement_list_title as "endorsement.list.title" }