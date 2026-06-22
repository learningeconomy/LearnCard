/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_RelationshipInputs */

const en_category_relationship = /** @type {(inputs: Category_RelationshipInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Relationship`)
};

const es_category_relationship = /** @type {(inputs: Category_RelationshipInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Relación`)
};

const fr_category_relationship = /** @type {(inputs: Category_RelationshipInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Relation`)
};

const ar_category_relationship = /** @type {(inputs: Category_RelationshipInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`علاقة`)
};

/**
* | output |
* | --- |
* | "Relationship" |
*
* @param {Category_RelationshipInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_relationship = /** @type {((inputs?: Category_RelationshipInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_RelationshipInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_relationship(inputs)
	if (locale === "es") return es_category_relationship(inputs)
	if (locale === "fr") return fr_category_relationship(inputs)
	return ar_category_relationship(inputs)
});
export { category_relationship as "category.relationship" }