/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_EventsInputs */

const en_category_events = /** @type {(inputs: Category_EventsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Events`)
};

const es_category_events = /** @type {(inputs: Category_EventsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eventos`)
};

const fr_category_events = /** @type {(inputs: Category_EventsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Événements`)
};

const ar_category_events = /** @type {(inputs: Category_EventsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الأحداث`)
};

/**
* | output |
* | --- |
* | "Events" |
*
* @param {Category_EventsInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_events = /** @type {((inputs?: Category_EventsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_EventsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_events(inputs)
	if (locale === "es") return es_category_events(inputs)
	if (locale === "fr") return fr_category_events(inputs)
	return ar_category_events(inputs)
});
export { category_events as "category.events" }