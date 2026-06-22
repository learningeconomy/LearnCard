/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Members_GuardianInputs */

const en_family_members_guardian = /** @type {(inputs: Family_Members_GuardianInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardian`)
};

const es_family_members_guardian = /** @type {(inputs: Family_Members_GuardianInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tutor`)
};

const fr_family_members_guardian = /** @type {(inputs: Family_Members_GuardianInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tuteur`)
};

const ar_family_members_guardian = /** @type {(inputs: Family_Members_GuardianInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ولي الأمر`)
};

/**
* | output |
* | --- |
* | "Guardian" |
*
* @param {Family_Members_GuardianInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_members_guardian = /** @type {((inputs?: Family_Members_GuardianInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Members_GuardianInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_members_guardian(inputs)
	if (locale === "es") return es_family_members_guardian(inputs)
	if (locale === "fr") return fr_family_members_guardian(inputs)
	return ar_family_members_guardian(inputs)
});
export { family_members_guardian as "family.members.guardian" }