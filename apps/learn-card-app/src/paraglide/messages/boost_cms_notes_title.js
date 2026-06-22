/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Notes_TitleInputs */

const en_boost_cms_notes_title = /** @type {(inputs: Boost_Cms_Notes_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notes`)
};

const es_boost_cms_notes_title = /** @type {(inputs: Boost_Cms_Notes_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notas`)
};

const fr_boost_cms_notes_title = /** @type {(inputs: Boost_Cms_Notes_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notes`)
};

const ar_boost_cms_notes_title = /** @type {(inputs: Boost_Cms_Notes_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملاحظات`)
};

/**
* | output |
* | --- |
* | "Notes" |
*
* @param {Boost_Cms_Notes_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_notes_title = /** @type {((inputs?: Boost_Cms_Notes_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Notes_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_notes_title(inputs)
	if (locale === "es") return es_boost_cms_notes_title(inputs)
	if (locale === "fr") return fr_boost_cms_notes_title(inputs)
	return ar_boost_cms_notes_title(inputs)
});
export { boost_cms_notes_title as "boost.cms.notes.title" }