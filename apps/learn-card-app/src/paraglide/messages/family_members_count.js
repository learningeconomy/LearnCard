/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Family_Members_CountInputs */

const en_family_members_count = /** @type {(inputs: Family_Members_CountInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Members`)
};

const es_family_members_count = /** @type {(inputs: Family_Members_CountInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} miembros`)
};

const fr_family_members_count = /** @type {(inputs: Family_Members_CountInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} membres`)
};

const ar_family_members_count = /** @type {(inputs: Family_Members_CountInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} عضو`)
};

/**
* | output |
* | --- |
* | "{count} Members" |
*
* @param {Family_Members_CountInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_members_count = /** @type {((inputs: Family_Members_CountInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Members_CountInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_members_count(inputs)
	if (locale === "es") return es_family_members_count(inputs)
	if (locale === "fr") return fr_family_members_count(inputs)
	return ar_family_members_count(inputs)
});
export { family_members_count as "family.members.count" }