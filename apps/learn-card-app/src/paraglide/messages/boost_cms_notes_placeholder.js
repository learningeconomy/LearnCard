/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Notes_PlaceholderInputs */

const en_boost_cms_notes_placeholder = /** @type {(inputs: Boost_Cms_Notes_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add a message...`)
};

const es_boost_cms_notes_placeholder = /** @type {(inputs: Boost_Cms_Notes_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregar un mensaje...`)
};

const fr_boost_cms_notes_placeholder = /** @type {(inputs: Boost_Cms_Notes_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un message...`)
};

const ar_boost_cms_notes_placeholder = /** @type {(inputs: Boost_Cms_Notes_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة رسالة...`)
};

/**
* | output |
* | --- |
* | "Add a message..." |
*
* @param {Boost_Cms_Notes_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_notes_placeholder = /** @type {((inputs?: Boost_Cms_Notes_PlaceholderInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Notes_PlaceholderInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_notes_placeholder(inputs)
	if (locale === "es") return es_boost_cms_notes_placeholder(inputs)
	if (locale === "fr") return fr_boost_cms_notes_placeholder(inputs)
	return ar_boost_cms_notes_placeholder(inputs)
});
export { boost_cms_notes_placeholder as "boost.cms.notes.placeholder" }