/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Membership_EmptyInputs */

const en_membership_empty = /** @type {(inputs: Membership_EmptyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You don't have any Troops yet.`)
};

const es_membership_empty = /** @type {(inputs: Membership_EmptyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no tienes Troops.`)
};

const fr_membership_empty = /** @type {(inputs: Membership_EmptyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous n'avez pas encore de troupes.`)
};

const ar_membership_empty = /** @type {(inputs: Membership_EmptyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You don't have any Troops yet.`)
};

/**
* | output |
* | --- |
* | "You don't have any Troops yet." |
*
* @param {Membership_EmptyInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const membership_empty = /** @type {((inputs?: Membership_EmptyInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Membership_EmptyInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_membership_empty(inputs)
	if (locale === "es") return es_membership_empty(inputs)
	if (locale === "fr") return fr_membership_empty(inputs)
	return ar_membership_empty(inputs)
});
export { membership_empty as "membership.empty" }